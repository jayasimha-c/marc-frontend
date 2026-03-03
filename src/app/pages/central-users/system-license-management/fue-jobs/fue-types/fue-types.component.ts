import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FueTypeService } from '../fue-type.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { TableColumn, TableAction } from '../../../../../shared/components/advanced-table/advanced-table.models';

@Component({
    standalone: false,
    selector: 'app-fue-types',
    templateUrl: './fue-types.component.html'
})
export class FueTypesComponent implements OnInit {

    @ViewChild('codeTpl', { static: true }) codeTpl!: TemplateRef<any>;
    @ViewChild('nameTpl', { static: true }) nameTpl!: TemplateRef<any>;
    @ViewChild('weightTpl', { static: true }) weightTpl!: TemplateRef<any>;
    @ViewChild('usersPerFueTpl', { static: true }) usersPerFueTpl!: TemplateRef<any>;
    @ViewChild('tierTpl', { static: true }) tierTpl!: TemplateRef<any>;
    @ViewChild('orderTpl', { static: true }) orderTpl!: TemplateRef<any>;
    @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<any>;

    columns: TableColumn[] = [];
    tableActions: TableAction[] = [];
    data: any[] = [];
    loading = false;
    editMode = false;
    selectedRow: any = null;
    selectedRows = new Set<any>();

    constructor(
        private fueTypeService: FueTypeService,
        private notificationService: NotificationService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.initTable();
        this.loadData();
    }

    initTable(): void {
        this.columns = [
            { field: 'code', header: 'Code', type: 'template', templateRef: this.codeTpl, width: '100px' },
            { field: 'name', header: 'Name', type: 'template', templateRef: this.nameTpl, width: '200px' },
            { field: 'fueWeight', header: 'FUE Weight', type: 'template', templateRef: this.weightTpl, width: '120px' },
            { field: 'usersPerFue', header: 'Users / FUE', type: 'template', templateRef: this.usersPerFueTpl, width: '120px' },
            { field: 'tierPriority', header: 'Tier Priority', type: 'template', templateRef: this.tierTpl, width: '120px' },
            { field: 'displayOrder', header: 'Display Order', type: 'template', templateRef: this.orderTpl, width: '120px' },
            { field: 'status', header: 'Status', type: 'template', templateRef: this.statusTpl, width: '100px' }
        ];

        this.buildActions();
    }

    buildActions(): void {
        this.tableActions = [
            { label: 'Save', icon: 'save', type: 'primary', command: () => this.save(), pinned: true, disabled: !this.editMode },
            { label: 'Edit', icon: 'edit', command: () => this.toggleEdit(), pinned: true, disabled: this.editMode },
            { label: 'Add Row', icon: 'plus-circle', command: () => this.addRow(), pinned: true },
            { label: 'Cancel', icon: 'undo', command: () => this.cancel() },
            { label: 'Delete', icon: 'delete', danger: true, command: () => this.deleteRow() },
            { label: 'Export CSV', icon: 'download', command: () => this.exportCsv() },
            { label: 'Add Initial Data', icon: 'plus', command: () => this.addInitialData() },
            { label: 'Simulate', icon: 'experiment', command: () => this.openSimulator() },
            { label: 'ACM to FUE Mapping', icon: 'swap', command: () => this.generateAcmMapping() }
        ];
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
                this.buildActions();
            },
            error: () => { this.data = []; this.loading = false; }
        });
    }

    toggleEdit(): void {
        this.editMode = true;
        this.buildActions();
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
        this.buildActions();
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
        this.buildActions();
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

    onSelectionChange(selected: Set<any>): void {
        this.selectedRows = selected;
        if (selected.size === 1) {
            this.selectedRow = Array.from(selected)[0];
        }
    }
}
