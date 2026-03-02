import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { RcConceptService, RcSimulationResultDTO, RoleSimulationResult } from '../rc-concept.service';

@Component({
    selector: 'app-rc-pattern-simulator',
    templateUrl: './rc-pattern-simulator.component.html',
    styleUrls: ['./rc-pattern-simulator.component.scss'],
    standalone: false,
})
export class RcPatternSimulatorComponent implements OnInit {

    conceptId: number | null = null;
    conceptName = '';
    loading = false;

    // Input
    roleNames: string[] = [];
    roleInput = '';

    // Results
    simulationResult: RcSimulationResultDTO | null = null;
    simulating = false;

    // Stats
    get matchedCount(): number { return this.simulationResult?.matchedCount || 0; }
    get unmatchedCount(): number { return this.simulationResult?.noMatchCount || 0; }
    get conflictCount(): number { return this.simulationResult?.conflictCount || 0; }

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private rcConceptService: RcConceptService,
        private message: NzMessageService,
    ) {}

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.conceptId = +idParam;
            this.loadConcept();
        }
    }

    loadConcept(): void {
        if (!this.conceptId) return;
        this.loading = true;
        this.rcConceptService.getConceptById(this.conceptId).subscribe({
            next: res => {
                this.conceptName = res.data?.name || '';
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    addRoles(): void {
        if (!this.roleInput.trim()) return;
        const newRoles = this.roleInput
            .split(/[\n,;]+/)
            .map(r => r.trim())
            .filter(r => r && !this.roleNames.includes(r));
        this.roleNames.push(...newRoles);
        this.roleInput = '';
    }

    removeRole(index: number): void {
        this.roleNames.splice(index, 1);
    }

    clearRoles(): void {
        this.roleNames = [];
        this.simulationResult = null;
    }

    simulate(): void {
        if (this.roleNames.length === 0 || !this.conceptId) return;
        this.simulating = true;
        this.rcConceptService.simulatePatterns(this.conceptId, this.roleNames).subscribe({
            next: res => {
                this.simulationResult = res.data;
                this.simulating = false;
            },
            error: () => {
                this.message.error('Simulation failed');
                this.simulating = false;
            }
        });
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'MATCHED': return 'success';
            case 'CONFLICT': return 'warning';
            case 'NO_MATCH': return 'default';
            default: return 'default';
        }
    }

    goBack(): void {
        this.router.navigate(['rc-concepts', this.conceptId], { relativeTo: this.route.parent });
    }
}
