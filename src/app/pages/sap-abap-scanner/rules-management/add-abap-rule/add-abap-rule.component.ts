import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../core/services/notification.service';
import { AbapService } from '../../abap.service';

@Component({
  standalone: false,
  selector: 'app-add-abap-rule',
  templateUrl: './add-abap-rule.component.html',
  styleUrls: ['./add-abap-rule.component.scss'],
})
export class AddAbapRuleComponent implements OnInit {
  form!: FormGroup;
  currentStep = 0;
  formType: 'add' | 'edit' = 'add';
  isSaving = false;

  categoryList: any[] = [];
  owaspCategoryList: any[] = [];
  tagList: any[] = [];
  selectedPatterns: any[] = [];

  severityList = [
    { value: 'Critical', label: 'Critical' },
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
    { value: 'Info', label: 'Info' },
  ];

  private ruleData: any = null;

  constructor(
    private fb: FormBuilder,
    private abapService: AbapService,
    private notification: NotificationService,
    private router: Router
  ) {
    this.form = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      severity: ['', Validators.required],
      description: [''],
      recommendation: [''],
      fixExample: [''],
      referenceUrl: [''],
      cweId: [''],
      categoryId: [null, Validators.required],
      owaspCategoryId: [null, Validators.required],
      active: [true],
      tags: [[]],
    });
  }

  ngOnInit(): void {
    const state = window.history.state;
    this.ruleData = state?.rule;
    this.formType = state?.formType || 'add';

    this.loadCategories();
    this.loadOwaspCategories();
    this.loadTags();

    if (this.formType === 'edit' && this.ruleData) {
      this.patchForm(this.ruleData);
    }
  }

  private patchForm(rule: any): void {
    this.form.patchValue({
      id: rule.id,
      name: rule.name,
      severity: rule.severity,
      description: rule.description,
      recommendation: rule.recommendation,
      fixExample: rule.fixExample,
      referenceUrl: rule.referenceUrl,
      cweId: rule.cweId,
      categoryId: rule.categoryId,
      owaspCategoryId: rule.owaspCategoryId,
      active: rule.active,
      tags: rule.tags?.map((tag: any) => tag.id) || [],
    });
    this.selectedPatterns = rule?.detectionPatterns || [];
  }

  private loadCategories(): void {
    this.abapService.getAbapCategories().subscribe({
      next: (res) => {
        if (res.success) {
          this.categoryList = res.data?.rows || res.data || [];
        }
      },
    });
  }

  private loadOwaspCategories(): void {
    this.abapService.getOwaspCategories().subscribe({
      next: (res) => {
        if (res.success) {
          this.owaspCategoryList = res.data?.rows || res.data || [];
        }
      },
    });
  }

  private loadTags(): void {
    this.abapService.getAbapTags().subscribe({
      next: (res) => {
        if (res.success) {
          this.tagList = res.data?.rows || res.data || [];
        }
      },
    });
  }

  onPatternsChanged(patterns: any[]): void {
    this.selectedPatterns = patterns;
  }

  onSave(): void {
    if (!this.form.valid) {
      Object.values(this.form.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity();
        }
      });
      this.notification.warn('Please fill in all required fields');
      this.currentStep = 0;
      return;
    }

    this.isSaving = true;
    const payload = {
      ...this.form.value,
      tags: (this.form.value.tags || []).map((id: number) => ({ id })),
      detectionPatterns: this.selectedPatterns,
    };

    this.abapService.saveRule(payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) {
          this.notification.success('Rule saved successfully');
          this.router.navigate(['/sap-abap-scanner/rules-management']);
        } else {
          this.notification.error(res.message || 'Save failed');
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.notification.error(err.error?.message || 'Error saving rule');
      },
    });
  }

  navigateBack(): void {
    this.router.navigate(['/sap-abap-scanner/rules-management']);
  }
}
