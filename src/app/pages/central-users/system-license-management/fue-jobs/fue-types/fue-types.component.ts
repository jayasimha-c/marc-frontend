import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FueTypeService } from '../fue-type.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
    standalone: false,
    selector: 'app-fue-types',
    templateUrl: './fue-types.component.html'
})
export class FueTypesComponent implements OnInit {
    data: any[] = [];
    loading = false;
    editMode = false;
    selectedRow: any = null;

    constructor(
        private fueTypeService: FueTypeService,
        private notificationService: NotificationService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loading = true;
        this.fueTypeService.getAll().subscribe({
            next: (res: any) => {
                this.data = (res.data || []).map((row: any) => ({
                    ...row,
                    status: row.active ? 'Active' : 'Inactive'
                }));
                this.loading = false;
                this.editMode = false;
            },
            error: () => { this.data = []; this.loading = false; }
        });
    }

    toggleEdit(): void {
        this.editMode = true;
    }

    cancel(): void {
        this.loadData();
    }

    addRow(): void {
        this.data = [...this.data, {
            code: '', name: '', fueWeight: 0, usersPerFue: 0,
            tierPriority: 0, displayOrder: 0, active: true, status: 'Active'
        }];
        this.editMode = true;
    }

    deleteRow(): void {
        if (!this.selectedRow) {
            this.notificationService.error('Please select a row to delete');
            return;
        }
        if (this.selectedRow.id) {
            this.fueTypeService.delete(this.selectedRow.id).subscribe({
                next: () => {
                    this.notificationService.success('Deleted');
                    this.selectedRow = null;
                    this.loadData();
                },
                error: (err: any) => this.notificationService.error(err.error?.message || 'Failed to delete')
            });
        } else {
            this.data = this.data.filter(r => r !== this.selectedRow);
            this.selectedRow = null;
        }
    }

    save(): void {
        const validRows = this.data.filter(r => r.name?.trim() && r.code?.trim());
        if (validRows.length === 0) {
            this.notificationService.error('No valid data to save');
            return;
        }
        let saved = 0, errors = 0;
        const saveNext = (i: number) => {
            if (i >= validRows.length) {
                errors === 0
                    ? this.notificationService.success(`Saved ${saved} items`)
                    : this.notificationService.error(`Saved ${saved}, failed ${errors}`);
                this.loadData();
                return;
            }
            this.fueTypeService.save(validRows[i]).subscribe({
                next: () => { saved++; saveNext(i + 1); },
                error: () => { errors++; saveNext(i + 1); }
            });
        };
        saveNext(0);
    }

    addInitialData(): void {
        const templates = [
            { name: 'Developer', code: 'GDEV', fueWeight: 1.000, usersPerFue: 1.0, tierPriority: 100, displayOrder: 1, active: true },
            { name: 'Test', code: 'GTES', fueWeight: 0.500, usersPerFue: 2.0, tierPriority: 90, displayOrder: 2, active: true },
            { name: 'Customizing User', code: 'GCCU', fueWeight: 0.500, usersPerFue: 2.0, tierPriority: 80, displayOrder: 3, active: true },
            { name: 'Business Authorization User', code: 'GBAU', fueWeight: 0.300, usersPerFue: 3.3, tierPriority: 70, displayOrder: 4, active: true },
            { name: 'Business Process User', code: 'GBPU', fueWeight: 0.200, usersPerFue: 5.0, tierPriority: 60, displayOrder: 5, active: true },
            { name: 'Business Self-Service', code: 'GBSS', fueWeight: 0.040, usersPerFue: 25.0, tierPriority: 10, displayOrder: 6, active: true },
        ];
        this.data = [...this.data, ...templates.map(t => ({ ...t, status: 'Active' }))];
        this.editMode = true;
        this.notificationService.success(`Added ${templates.length} initial FUE types. Remember to save!`);
    }

    exportCsv(): void {
        let csv = 'Code,Name,FUE Weight,Users Per FUE,Tier Priority,Display Order,Active\n';
        this.data.forEach(r => {
            csv += `"${(r.code || '').replace(/"/g, '""')}","${(r.name || '').replace(/"/g, '""')}",${r.fueWeight},${r.usersPerFue},${r.tierPriority},${r.displayOrder},${r.active ? 'Yes' : 'No'}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fue_types_export.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }

    openSimulator(): void {
        this.router.navigate(['../fue-simulator'], { relativeTo: this.route });
    }

    generateAcmMapping(): void {
        this.loading = true;
        this.fueTypeService.generateAcmMapping().subscribe({
            next: (res: any) => {
                const d = res.data || {};
                this.notificationService.success(`Generated ${d.totalMappings || 0} mappings`);
                this.loading = false;
            },
            error: (err: any) => {
                this.notificationService.error(err.error?.message || 'Failed');
                this.loading = false;
            }
        });
    }

    onRowClick(row: any): void {
        this.selectedRow = row;
    }
}
