import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { RcConceptService, RcConceptDTO, SapSystemInfo } from './rc-concept.service';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
    selector: 'app-rc-concept-list',
    templateUrl: './rc-concept-list.component.html',
    styleUrls: ['./rc-concept-list.component.scss'],
    standalone: false,
})
export class RcConceptListComponent implements OnInit {

    data: RcConceptDTO[] = [];
    loading = false;

    sapSystems: SapSystemInfo[] = [];
    allSystems: SapSystemInfo[] = [];

    selectedRows: RcConceptDTO[] = [];

    // Clone dialog
    cloneVisible = false;
    cloneSourceId: number | null = null;
    cloneName = '';

    // Delete dialog
    deleteVisible = false;
    deleteIds: number[] = [];

    // Assign dialog
    assignVisible = false;
    assignConceptId: number | null = null;
    assignedSystemIds: number[] = [];
    savingAssignment = false;

    columns: TableColumn[] = [
        { field: 'name', header: 'Concept Name', sortable: true, filterable: true },
        { field: 'description', header: 'Description', sortable: true },
        { field: 'patternsCount', header: 'Patterns', sortable: true, width: '90px', type: 'number' },
        { field: 'masterDataCount', header: 'Master Data', sortable: true, width: '100px', type: 'number' },
        { field: 'assignedSystemsCount', header: 'Systems', sortable: true, width: '90px', type: 'number' },
        { field: 'createdOn', header: 'Created', sortable: true, width: '130px', type: 'date', dateFormat: 'short' },
    ];

    tableActions: TableAction[] = [
        { label: 'New Concept', icon: 'plus-circle', type: 'primary', command: () => this.onAdd() },
        { label: 'Delete', icon: 'delete', type: 'default', danger: true,
            command: () => this.onDeleteSelected(),
            disabled: false
        },
    ];

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private rcConceptService: RcConceptService,
        private modal: NzModalService,
        private message: NzMessageService,
    ) {}

    ngOnInit(): void {
        this.loadInfo();
        this.loadData();
    }

    loadInfo(): void {
        this.rcConceptService.getInfo().subscribe({
            next: res => {
                this.sapSystems = res.data?.sapSystems || [];
                this.allSystems = [...this.sapSystems];
            }
        });
    }

    loadData(): void {
        this.loading = true;
        this.rcConceptService.getAllConcepts().subscribe({
            next: res => {
                this.data = res.data || [];
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    onSelectionChange(rows: RcConceptDTO[]): void {
        this.selectedRows = rows;
        this.tableActions[1].disabled = rows.length === 0;
    }

    onRowClick(row: RcConceptDTO): void {
        this.router.navigate([row.id], { relativeTo: this.route });
    }

    // ─── Add ──────────────────────────────────────────
    onAdd(): void {
        this.router.navigate(['new'], { relativeTo: this.route });
    }

    // ─── Clone ────────────────────────────────────────
    onClone(concept: RcConceptDTO): void {
        this.cloneSourceId = concept.id!;
        this.cloneName = concept.name + ' (copy)';
        this.cloneVisible = true;
    }

    confirmClone(): void {
        if (!this.cloneSourceId || !this.cloneName) return;
        this.rcConceptService.cloneConcept(this.cloneSourceId, this.cloneName).subscribe({
            next: () => {
                this.message.success('Concept cloned');
                this.cloneVisible = false;
                this.loadData();
            },
            error: () => this.message.error('Clone failed')
        });
    }

    cancelClone(): void {
        this.cloneVisible = false;
    }

    // ─── Delete ───────────────────────────────────────
    onDeleteSelected(): void {
        this.deleteIds = this.selectedRows.map(r => r.id!);
        this.deleteVisible = true;
    }

    onDelete(concept: RcConceptDTO): void {
        this.deleteIds = [concept.id!];
        this.deleteVisible = true;
    }

    confirmDelete(): void {
        const promises = this.deleteIds.map(id =>
            this.rcConceptService.deleteConcept(id).toPromise()
        );
        Promise.all(promises).then(() => {
            this.message.success('Deleted');
            this.deleteVisible = false;
            this.selectedRows = [];
            this.loadData();
        }).catch(() => this.message.error('Delete failed'));
    }

    cancelDelete(): void {
        this.deleteVisible = false;
    }

    // ─── Assign Systems ──────────────────────────────
    onAssignSystems(concept: RcConceptDTO): void {
        this.assignConceptId = concept.id!;
        this.assignVisible = true;
        this.assignedSystemIds = [];
        this.rcConceptService.getAssignedSystemIds(concept.id!).subscribe({
            next: res => {
                this.assignedSystemIds = res.data || [];
            }
        });
    }

    confirmAssign(): void {
        if (!this.assignConceptId) return;
        this.savingAssignment = true;
        this.rcConceptService.assignToSystems(this.assignConceptId, this.assignedSystemIds).subscribe({
            next: () => {
                this.message.success('Systems assigned');
                this.assignVisible = false;
                this.savingAssignment = false;
                this.loadData();
            },
            error: () => {
                this.message.error('Assignment failed');
                this.savingAssignment = false;
            }
        });
    }

    cancelAssign(): void {
        this.assignVisible = false;
    }
}
