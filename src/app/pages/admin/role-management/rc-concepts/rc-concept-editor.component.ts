import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { RcConceptService, RcConceptDTO, RcPatternDTO, RcMasterDataDTO } from './rc-concept.service';

const MASTER_DATA_CATEGORIES = [
    'BUSINESS_PROCESS', 'SUB_PROCESS', 'DEPARTMENT', 'DIVISION', 'CRITICALITY', 'ROLE_TYPE'
];

@Component({
    selector: 'app-rc-concept-editor',
    templateUrl: './rc-concept-editor.component.html',
    styleUrls: ['./rc-concept-editor.component.scss'],
    standalone: false,
})
export class RcConceptEditorComponent implements OnInit {
    @ViewChild('importFileInput') importFileInput!: ElementRef<HTMLInputElement>;

    conceptId: number | null = null;
    isNew = true;
    loading = false;
    saving = false;
    activeTab = 0;

    // Concept
    concept: RcConceptDTO = {
        name: '',
        description: '',
        isActive: true
    };

    // Patterns
    patterns: RcPatternDTO[] = [];
    editingPattern: RcPatternDTO | null = null;
    patternDialogVisible = false;
    patternTypes = ['REGEX', 'PREFIX', 'SUFFIX', 'CONTAINS', 'EXACT', 'WILDCARD'];

    // Master Data
    masterData: RcMasterDataDTO[] = [];
    editingMasterData: RcMasterDataDTO | null = null;
    masterDataDialogVisible = false;
    masterDataCategories = MASTER_DATA_CATEGORIES;
    selectedCategory = '';

    // Pattern test
    testRoleName = '';
    testResult: any = null;
    testDialogVisible = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private rcConceptService: RcConceptService,
        private message: NzMessageService,
        private modal: NzModalService,
    ) {}

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam && idParam !== 'new') {
            this.conceptId = +idParam;
            this.isNew = false;
            this.loadConcept();
        }
    }

    loadConcept(): void {
        if (!this.conceptId) return;
        this.loading = true;
        this.rcConceptService.getConceptById(this.conceptId).subscribe({
            next: res => {
                this.concept = res.data;
                this.loadPatterns();
                this.loadMasterData();
                this.loading = false;
            },
            error: () => {
                this.message.error('Failed to load concept');
                this.loading = false;
            }
        });
    }

    loadPatterns(): void {
        if (!this.conceptId) return;
        this.rcConceptService.getPatterns(this.conceptId).subscribe({
            next: res => {
                this.patterns = res.data || [];
            }
        });
    }

    loadMasterData(): void {
        if (!this.conceptId) return;
        this.rcConceptService.getMasterData(this.conceptId).subscribe({
            next: res => {
                this.masterData = res.data || [];
            }
        });
    }

    // ─── Save ──────────────────────────────────────────
    save(): void {
        if (!this.concept.name) {
            this.message.warning('Name is required');
            return;
        }
        this.saving = true;

        const observable = this.isNew
            ? this.rcConceptService.createConcept(this.concept)
            : this.rcConceptService.updateConcept(this.conceptId!, this.concept);

        observable.subscribe({
            next: res => {
                this.message.success(this.isNew ? 'Concept created' : 'Concept saved');
                this.saving = false;
                if (this.isNew && res.data?.id) {
                    this.conceptId = res.data.id;
                    this.isNew = false;
                    this.router.navigate(['rc-concepts', this.conceptId], { relativeTo: this.route.parent });
                }
            },
            error: () => {
                this.message.error('Save failed');
                this.saving = false;
            }
        });
    }

    goBack(): void {
        this.router.navigate(['rc-concepts'], { relativeTo: this.route.parent });
    }

    // ─── Patterns ──────────────────────────────────────
    addPattern(): void {
        this.editingPattern = {
            pattern: '',
            patternType: 'REGEX',
            priority: this.patterns.length + 1,
            isActive: true
        };
        this.patternDialogVisible = true;
    }

    editPattern(pattern: RcPatternDTO): void {
        this.editingPattern = { ...pattern };
        this.patternDialogVisible = true;
    }

    savePattern(): void {
        if (!this.editingPattern?.pattern) {
            this.message.warning('Pattern is required');
            return;
        }

        if (!this.conceptId) {
            // Not yet saved — just add locally
            const idx = this.patterns.findIndex(p => p.id === this.editingPattern!.id && p.id);
            if (idx >= 0) {
                this.patterns[idx] = { ...this.editingPattern! };
            } else {
                this.patterns.push({ ...this.editingPattern! });
            }
            this.patternDialogVisible = false;
            return;
        }

        if (this.editingPattern.id) {
            this.rcConceptService.updatePattern(this.conceptId, this.editingPattern.id, this.editingPattern).subscribe({
                next: () => {
                    this.message.success('Pattern updated');
                    this.patternDialogVisible = false;
                    this.loadPatterns();
                },
                error: () => this.message.error('Failed to update pattern')
            });
        } else {
            this.rcConceptService.addPattern(this.conceptId, this.editingPattern).subscribe({
                next: () => {
                    this.message.success('Pattern added');
                    this.patternDialogVisible = false;
                    this.loadPatterns();
                },
                error: () => this.message.error('Failed to add pattern')
            });
        }
    }

    cancelPatternDialog(): void {
        this.patternDialogVisible = false;
    }

    deletePattern(pattern: RcPatternDTO, idx: number): void {
        if (this.conceptId && pattern.id) {
            this.rcConceptService.deletePattern(this.conceptId, pattern.id).subscribe({
                next: () => {
                    this.message.success('Pattern deleted');
                    this.loadPatterns();
                },
                error: () => this.message.error('Failed to delete pattern')
            });
        } else {
            this.patterns.splice(idx, 1);
        }
    }

    // ─── Master Data ───────────────────────────────────
    get filteredMasterData(): RcMasterDataDTO[] {
        if (!this.selectedCategory) return this.masterData;
        return this.masterData.filter(m => m.category === this.selectedCategory);
    }

    addMasterData(): void {
        this.editingMasterData = {
            category: this.selectedCategory || 'BUSINESS_PROCESS',
            code: '',
            name: '',
            isActive: true
        };
        this.masterDataDialogVisible = true;
    }

    editMasterData(item: RcMasterDataDTO): void {
        this.editingMasterData = { ...item };
        this.masterDataDialogVisible = true;
    }

    saveMasterData(): void {
        if (!this.editingMasterData?.code || !this.editingMasterData?.name) {
            this.message.warning('Code and Name are required');
            return;
        }

        if (this.conceptId) {
            this.rcConceptService.addMasterDataItem(this.conceptId, this.editingMasterData).subscribe({
                next: () => {
                    this.message.success('Master data saved');
                    this.masterDataDialogVisible = false;
                    this.loadMasterData();
                },
                error: () => this.message.error('Failed to save master data')
            });
        } else {
            const idx = this.masterData.findIndex(m => m.id === this.editingMasterData!.id && m.id);
            if (idx >= 0) {
                this.masterData[idx] = { ...this.editingMasterData! };
            } else {
                this.masterData.push({ ...this.editingMasterData! });
            }
            this.masterDataDialogVisible = false;
        }
    }

    cancelMasterDataDialog(): void {
        this.masterDataDialogVisible = false;
    }

    deleteMasterData(item: RcMasterDataDTO, idx: number): void {
        if (this.conceptId && item.id) {
            this.rcConceptService.deleteMasterDataItem(this.conceptId, item.id).subscribe({
                next: () => {
                    this.message.success('Master data deleted');
                    this.loadMasterData();
                },
                error: () => this.message.error('Failed to delete')
            });
        } else {
            this.masterData.splice(idx, 1);
        }
    }

    // ─── Pattern Simulation ─────────────────────────────
    openTestDialog(): void {
        this.testRoleName = '';
        this.testResult = null;
        this.testDialogVisible = true;
    }

    runPatternTest(): void {
        if (!this.testRoleName || !this.conceptId) return;
        this.rcConceptService.simulatePatterns(this.conceptId, [this.testRoleName]).subscribe({
            next: res => {
                this.testResult = res.data;
            },
            error: () => {
                this.message.error('Simulation failed');
            }
        });
    }

    closeTestDialog(): void {
        this.testDialogVisible = false;
    }

    // ─── Excel Import/Export ─────────────────────────
    triggerImport(): void {
        this.importFileInput?.nativeElement?.click();
    }

    onImportFile(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input?.files?.[0];
        if (!file) return;

        import('xlsx').then(XLSX => {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                const wb = XLSX.read(e.target.result, { type: 'binary' });
                const patternSheet = wb.Sheets[wb.SheetNames[0]];
                const importedPatterns: any[] = XLSX.utils.sheet_to_json(patternSheet);
                for (const row of importedPatterns) {
                    this.patterns.push({
                        pattern: row['Pattern'] || row.pattern || '',
                        patternType: row['Type'] || row.patternType || 'REGEX',
                        businessProcess: row['Business Process'] || row.businessProcess || '',
                        subProcess: row['Sub Process'] || row.subProcess || '',
                        department: row['Department'] || row.department || '',
                        division: row['Division'] || row.division || '',
                        criticality: row['Criticality'] || row.criticality || '',
                        roleType: row['Role Type'] || row.roleType || '',
                        approvers: row['Approvers'] || row.approvers || '',
                        backupApprovers: row['Backup Approvers'] || row.backupApprovers || '',
                        priority: this.patterns.length + 1,
                        isActive: true
                    });
                }

                if (wb.SheetNames.length > 1) {
                    const mdSheet = wb.Sheets[wb.SheetNames[1]];
                    const importedMd: any[] = XLSX.utils.sheet_to_json(mdSheet);
                    for (const row of importedMd) {
                        this.masterData.push({
                            category: row['Category'] || row.category || 'BUSINESS_PROCESS',
                            code: row['Code'] || row.code || '',
                            name: row['Name'] || row.name || '',
                            isActive: true
                        });
                    }
                }

                this.message.success(`Imported ${importedPatterns.length} patterns`);
            };
            reader.readAsBinaryString(file);
            input.value = '';
        });
    }

    exportExcel(): void {
        import('xlsx').then(XLSX => {
            const wb = XLSX.utils.book_new();

            const patternRows = this.patterns.map(p => ({
                'Pattern': p.pattern,
                'Type': p.patternType,
                'Business Process': p.businessProcess || '',
                'Sub Process': p.subProcess || '',
                'Department': p.department || '',
                'Division': p.division || '',
                'Criticality': p.criticality || '',
                'Role Type': p.roleType || '',
                'Approvers': p.approvers || '',
                'Backup Approvers': p.backupApprovers || '',
                'Priority': p.priority || 0,
                'Active': p.isActive ? 'Yes' : 'No'
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(patternRows), 'Patterns');

            const mdRows = this.masterData.map(m => ({
                'Category': m.category,
                'Code': m.code,
                'Name': m.name,
                'Active': m.isActive ? 'Yes' : 'No'
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mdRows), 'Master Data');

            XLSX.writeFile(wb, `rc-concept-${this.concept.name || 'export'}.xlsx`);
        });
    }

    // ─── Navigate to Simulator ──────────────────────
    openSimulator(): void {
        if (this.conceptId) {
            this.router.navigate(['rc-concepts', this.conceptId, 'simulate'], { relativeTo: this.route.parent });
        }
    }
}
