import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { Subject, Observable, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, map, startWith } from 'rxjs/operators';
import { MitigationsService } from '../../mitigations.service';
import { NotificationService } from '../../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-add-mitigation',
  templateUrl: './add-mitigation.component.html',
})
export class AddMitigationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  form!: FormGroup;
  formType = 'add';
  sapSystemList: any[] = [];
  filteredRisks$!: Observable<string[]>;
  selectedFile: File | null = null;
  uploading = false;

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    private fb: FormBuilder,
    private mitigationsService: MitigationsService,
    private notificationService: NotificationService,
    public modalRef: NzModalRef,
  ) {
    this.form = this.fb.group({
      sapSystem: [null, [Validators.required]],
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      risk: ['', [Validators.required]],
      notification: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.formType = this.dialogData.formType;
    this.loadSystems();
    this.setupRiskAutocomplete();

    if (this.formType === 'edit' && this.dialogData.mitigationData) {
      const d = this.dialogData.mitigationData;
      this.form.patchValue({
        sapSystem: d.sapSystemId,
        name: d.name,
        description: d.description,
        risk: d.riskName,
        notification: d.notification?.toString(),
      });
      this.form.get('sapSystem')?.disable();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSystems(): void {
    this.mitigationsService.getRequiredData().pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.sapSystemList = res.data?.sapSystems || [];
    });
  }

  private setupRiskAutocomplete(): void {
    this.filteredRisks$ = this.form.get('risk')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value.length > 0) {
          return this.mitigationsService.searchRisks(value).pipe(
            map(res => (Array.isArray(res.data) ? res.data : []))
          );
        }
        return of([]);
      })
    );
  }

  onFileSelected(files: FileList): void {
    this.selectedFile = files?.[0] || null;
    if (this.selectedFile) {
      this.notificationService.success('File selected: ' + this.selectedFile.name);
    }
  }

  save(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) return;

    const raw = this.form.getRawValue();
    const payload: any = {
      sapSystemId: raw.sapSystem,
      name: raw.name,
      description: raw.description,
      riskName: raw.risk,
      notification: raw.notification,
    };

    if (this.formType === 'edit') {
      payload.id = this.dialogData.mitigationData.id;
      this.mitigationsService.editMitigation(payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.notificationService.success(`The Mitigation: ${raw.name} has been updated successfully.`);
            this.modalRef.close(true);
          } else {
            this.notificationService.error(res.message || 'Failed to update');
          }
        },
        error: (err: any) => this.notificationService.error(err?.error?.message || 'Update failed'),
      });
    } else {
      this.mitigationsService.addMitigation(payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.notificationService.success(`The Mitigation: ${raw.name} has been added successfully.`);
            this.modalRef.close(true);
          } else {
            this.notificationService.error(res.message || 'Failed to add');
          }
        },
        error: (err: any) => this.notificationService.error(err?.error?.message || 'Add failed'),
      });
    }
  }
}
