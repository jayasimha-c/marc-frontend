import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../core/services/notification.service';
import { AbapService } from '../../abap.service';

interface RegexPatternVO {
  id?: number;
  regexPattern: string;
  orderIndex: number;
  patternStage?: string;
  contextCaptureGroup?: number;
}

interface RegexValidation {
  isValid: boolean;
  error?: string;
}

enum EvaluationStrategy {
  SINGLE_STAGE = 'SINGLE_STAGE',
  MULTI_STAGE = 'MULTI_STAGE',
  MULTI_STAGE_EXCLUSIVE = 'MULTI_STAGE_EXCLUSIVE',
}

enum PatternStage {
  MAIN = 'MAIN',
  SECOND_STAGE = 'SECOND_STAGE',
  PARAM = 'PARAM',
}

@Component({
  standalone: false,
  selector: 'app-add-pattern',
  templateUrl: './add-pattern.component.html',
  styleUrls: ['./add-pattern.component.scss'],
})
export class AddPatternComponent implements OnInit {
  formType: string;
  regexValidations: RegexValidation[] = [];
  isSaving = false;

  EvaluationStrategy = EvaluationStrategy;
  PatternStage = PatternStage;

  evaluationStrategies = [
    { value: EvaluationStrategy.SINGLE_STAGE, label: 'Single Stage', description: 'Traditional OR logic - any pattern match triggers finding' },
    { value: EvaluationStrategy.MULTI_STAGE, label: 'Multi-Stage', description: 'Cascaded filtering (MAIN -> SECOND_STAGE) for reduced false positives' },
    { value: EvaluationStrategy.MULTI_STAGE_EXCLUSIVE, label: 'Multi-Stage Exclusive', description: 'All 3 stages required (MAIN -> SECOND_STAGE -> PARAM)' },
  ];

  patternStages = [
    { value: PatternStage.MAIN, label: 'Main' },
    { value: PatternStage.SECOND_STAGE, label: 'Second Stage' },
    { value: PatternStage.PARAM, label: 'Parameter' },
  ];

  form!: FormGroup;

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    private fb: FormBuilder,
    private abapService: AbapService,
    private notification: NotificationService,
    public modal: NzModalRef
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      evaluationStrategy: [EvaluationStrategy.SINGLE_STAGE, Validators.required],
      regexPatterns: this.fb.array([]),
      description: [''],
      id: [''],
      active: [true, Validators.required],
    });
    this.formType = this.dialogData.formType;
    if (this.formType === 'Edit') {
      this.form.patchValue({
        id: this.dialogData.data.id,
        name: this.dialogData.data.name,
        description: this.dialogData.data.description,
        evaluationStrategy: this.dialogData.data.evaluationStrategy || EvaluationStrategy.SINGLE_STAGE,
        active: this.dialogData.data.active,
      });
      const patterns = this.dialogData.data.regexPatterns || [];
      patterns.forEach((p: RegexPatternVO) => {
        this.addRegexPattern(p.regexPattern, p.id, p.orderIndex, p.patternStage || PatternStage.MAIN, p.contextCaptureGroup);
      });
    } else {
      this.addRegexPattern('', undefined, undefined, PatternStage.MAIN);
    }
  }

  ngOnInit(): void {
    this.regexPatterns.controls.forEach((_, index) => {
      this.validateRegexAtIndex(index);
    });
  }

  get regexPatterns(): FormArray {
    return this.form.get('regexPatterns') as FormArray;
  }

  get selectedEvaluationStrategy(): EvaluationStrategy {
    return this.form.get('evaluationStrategy')?.value;
  }

  get isMultiStage(): boolean {
    const strategy = this.selectedEvaluationStrategy;
    return strategy === EvaluationStrategy.MULTI_STAGE || strategy === EvaluationStrategy.MULTI_STAGE_EXCLUSIVE;
  }

  createRegexPatternGroup(
    regexPattern = '',
    id?: number,
    orderIndex?: number,
    patternStage: string = PatternStage.MAIN,
    contextCaptureGroup?: number
  ): FormGroup {
    return this.fb.group({
      id: [id || null],
      regexPattern: [regexPattern, Validators.required],
      orderIndex: [orderIndex ?? this.regexPatterns.length],
      patternStage: [patternStage, Validators.required],
      contextCaptureGroup: [contextCaptureGroup ?? null],
    });
  }

  addRegexPattern(
    regexPattern = '',
    id?: number,
    orderIndex?: number,
    patternStage: string = PatternStage.MAIN,
    contextCaptureGroup?: number
  ): void {
    this.regexPatterns.push(this.createRegexPatternGroup(regexPattern, id, orderIndex, patternStage, contextCaptureGroup));
    this.regexValidations.push({ isValid: true });
    if (regexPattern) {
      this.validateRegexAtIndex(this.regexPatterns.length - 1);
    }
  }

  removeRegexPattern(index: number): void {
    if (this.regexPatterns.length > 1) {
      this.regexPatterns.removeAt(index);
      this.regexValidations.splice(index, 1);
      this.regexPatterns.controls.forEach((control, idx) => {
        control.get('orderIndex')?.setValue(idx);
      });
    }
  }

  validateRegexAtIndex(index: number): void {
    const pattern = this.regexPatterns.at(index)?.get('regexPattern')?.value;
    this.regexValidations[index] = this.validateRegex(pattern);
  }

  validateRegex(pattern: string): RegexValidation {
    if (!pattern || pattern.trim() === '') return { isValid: true };
    try {
      const jsPattern = this.stripJavaRegexModifiers(pattern);
      new RegExp(jsPattern);
      return { isValid: true };
    } catch (e: any) {
      return { isValid: false, error: e.message || 'Invalid regex pattern' };
    }
  }

  private stripJavaRegexModifiers(pattern: string): string {
    let result = pattern;
    result = result.replace(/^\(\?[ismxuU]+\)/, '');
    result = result.replace(/\(\?[ismxuU]+:/g, '(?:');
    result = result.replace(/\(\?[ismxuU]+\)/g, '');
    return result;
  }

  get allPatternsValid(): boolean {
    return this.regexValidations.every((v) => v.isValid) && this.validateStrategyConfiguration();
  }

  validateStrategyConfiguration(): boolean {
    const strategy = this.selectedEvaluationStrategy;
    const patterns = this.regexPatterns.value as RegexPatternVO[];

    if (strategy === EvaluationStrategy.SINGLE_STAGE) {
      return patterns.every((p) => p.patternStage === PatternStage.MAIN);
    }
    if (strategy === EvaluationStrategy.MULTI_STAGE) {
      return patterns.some((p) => p.patternStage === PatternStage.MAIN);
    }
    if (strategy === EvaluationStrategy.MULTI_STAGE_EXCLUSIVE) {
      return (
        patterns.some((p) => p.patternStage === PatternStage.MAIN) &&
        patterns.some((p) => p.patternStage === PatternStage.SECOND_STAGE) &&
        patterns.some((p) => p.patternStage === PatternStage.PARAM)
      );
    }
    return true;
  }

  getStrategyValidationError(): string | null {
    const strategy = this.selectedEvaluationStrategy;
    const patterns = this.regexPatterns.value as RegexPatternVO[];

    if (strategy === EvaluationStrategy.SINGLE_STAGE) {
      if (patterns.some((p) => p.patternStage !== PatternStage.MAIN)) {
        return 'SINGLE_STAGE patterns must all have MAIN stage';
      }
    }
    if (strategy === EvaluationStrategy.MULTI_STAGE) {
      if (!patterns.some((p) => p.patternStage === PatternStage.MAIN)) {
        return 'MULTI_STAGE requires at least one MAIN stage pattern';
      }
    }
    if (strategy === EvaluationStrategy.MULTI_STAGE_EXCLUSIVE) {
      if (!patterns.some((p) => p.patternStage === PatternStage.MAIN)) return 'Requires at least one MAIN stage pattern';
      if (!patterns.some((p) => p.patternStage === PatternStage.SECOND_STAGE)) return 'Requires at least one SECOND_STAGE pattern';
      if (!patterns.some((p) => p.patternStage === PatternStage.PARAM)) return 'Requires at least one PARAM stage pattern';
    }
    return null;
  }

  save(): void {
    if (this.form.valid && this.allPatternsValid) {
      this.isSaving = true;
      const payload = {
        id: this.form.value.id || null,
        name: this.form.value.name,
        description: this.form.value.description,
        evaluationStrategy: this.form.value.evaluationStrategy,
        active: this.form.value.active,
        regexPatterns: this.form.value.regexPatterns.map((p: RegexPatternVO, index: number) => ({
          id: p.id || null,
          regexPattern: p.regexPattern,
          orderIndex: index,
          patternStage: p.patternStage,
          contextCaptureGroup: p.contextCaptureGroup,
        })),
      };
      this.abapService.saveDetectionPattern(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.notification.success('Saved successfully');
          this.modal.close(true);
        },
        error: (err) => {
          this.isSaving = false;
          this.notification.error(err.error?.message || 'Error saving pattern');
        },
      });
    } else if (!this.allPatternsValid) {
      const error = this.getStrategyValidationError();
      this.notification.error(error || 'Please fix invalid regex patterns before saving');
    }
  }
}
