import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AbapService } from '../../abap.service';
import { NotificationService } from '../../../../core/services/notification.service';

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

interface SimulationMatch {
  lineNumber: number;
  lineContent: string;
  matchedText: string;
  captureGroups: string[];
  stage: string;
  patternIndex: number;
}

interface StageResult {
  stage: string;
  matches: SimulationMatch[];
  passed: boolean;
}

interface SimulationResult {
  totalMatches: number;
  stageResults: StageResult[];
  finalVerdict: 'DETECTED' | 'NOT_DETECTED' | 'PARTIAL';
  matchedLines: number[];
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
  selector: 'app-edit-pattern-page',
  templateUrl: './edit-pattern-page.component.html',
  styleUrls: ['./edit-pattern-page.component.scss'],
})
export class EditPatternPageComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  @ViewChild('abapEditor') abapEditor!: ElementRef<HTMLPreElement>;
  @ViewChild('lineNumbers') lineNumbers!: ElementRef<HTMLDivElement>;

  isEditMode = false;
  patternId: number | null = null;
  isLoading = true;
  isSaving = false;

  EvaluationStrategy = EvaluationStrategy;
  PatternStage = PatternStage;

  form: FormGroup;
  regexValidations: RegexValidation[] = [];

  evaluationStrategies = [
    { value: EvaluationStrategy.SINGLE_STAGE, label: 'Single Stage', description: 'Any pattern match triggers finding' },
    { value: EvaluationStrategy.MULTI_STAGE, label: 'Multi-Stage', description: 'Cascaded filtering (MAIN -> SECOND_STAGE)' },
    { value: EvaluationStrategy.MULTI_STAGE_EXCLUSIVE, label: 'Multi-Stage Exclusive', description: 'All 3 stages required' },
  ];

  patternStages = [
    { value: PatternStage.MAIN, label: 'Main' },
    { value: PatternStage.SECOND_STAGE, label: '2nd Stage' },
    { value: PatternStage.PARAM, label: 'Param' },
  ];

  abapCode = '';
  lineNumbersArray: number[] = [1];

  simulationResult: SimulationResult | null = null;
  isSimulating = false;

  leftPanelWidth = 380;
  isResizing = false;
  private minPanelWidth = 280;
  private maxPanelWidth = 600;

  sampleAbapCode = `REPORT z_test_security_scan.

DATA: lv_password TYPE string VALUE 'secret123',
      lv_where TYPE string,
      lt_options TYPE TABLE OF rfc_db_opt.

* Dynamic SQL - potential injection
lv_where = 'MANDT = ' && sy-mandt.
SELECT * FROM usr02
  WHERE (lv_where).

* RFC Call with dynamic table
CALL FUNCTION 'RFC_READ_TABLE'
  EXPORTING
    query_table = 'USR02'
  TABLES
    options = lt_options.

* OS Command execution
CALL FUNCTION 'SXPG_COMMAND_EXECUTE'
  EXPORTING
    commandname = 'LS'
    additional_parameters = '-la'.

* Hardcoded IP address
DATA: lv_ip TYPE string VALUE '192.168.1.100'.

* Weak cryptography
CALL FUNCTION 'CALCULATE_HASH_FOR_RAW'
  EXPORTING
    alg = 'MD5'.`;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private abapService: AbapService,
    private notification: NotificationService,
    private sanitizer: DomSanitizer
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      evaluationStrategy: [EvaluationStrategy.SINGLE_STAGE, Validators.required],
      regexPatterns: this.fb.array([]),
      description: [''],
      id: [null],
      active: [true, Validators.required],
    });
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['id'] && params['id'] !== 'create') {
        this.isEditMode = true;
        this.patternId = +params['id'];
        this.loadPattern();
      } else {
        this.isEditMode = false;
        this.isLoading = false;
        this.addRegexPattern('', undefined, undefined, PatternStage.MAIN);
      }
    });
    this.abapCode = this.sampleAbapCode;
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.abapEditor?.nativeElement) {
        this.updateLineNumbers();
        this.highlightEditor();
      }
    }, 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== Pattern Loading ====================

  loadPattern(): void {
    if (!this.patternId) return;
    this.abapService.getDetectionPatternById(this.patternId).subscribe({
      next: (response) => {
        if (response.data) {
          const pattern = response.data;
          this.form.patchValue({
            id: pattern.id,
            name: pattern.name,
            description: pattern.description,
            evaluationStrategy: pattern.evaluationStrategy || EvaluationStrategy.SINGLE_STAGE,
            active: pattern.active,
          });
          (pattern.regexPatterns || []).forEach((p: RegexPatternVO) => {
            this.addRegexPattern(p.regexPattern, p.id, p.orderIndex, p.patternStage || PatternStage.MAIN, p.contextCaptureGroup);
          });
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Failed to load pattern');
        this.isLoading = false;
        this.router.navigate(['/sap-abap-scanner/detection-patterns']);
      },
    });
  }

  // ==================== Form Helpers ====================

  get regexPatterns(): FormArray {
    return this.form.get('regexPatterns') as FormArray;
  }

  get selectedEvaluationStrategy(): EvaluationStrategy {
    return this.form.get('evaluationStrategy')?.value;
  }

  get isMultiStage(): boolean {
    const s = this.selectedEvaluationStrategy;
    return s === EvaluationStrategy.MULTI_STAGE || s === EvaluationStrategy.MULTI_STAGE_EXCLUSIVE;
  }

  createRegexPatternGroup(regexPattern = '', id?: number, orderIndex?: number, patternStage: string = PatternStage.MAIN, contextCaptureGroup?: number): FormGroup {
    return this.fb.group({
      id: [id || null],
      regexPattern: [regexPattern, Validators.required],
      orderIndex: [orderIndex ?? this.regexPatterns.length],
      patternStage: [patternStage, Validators.required],
      contextCaptureGroup: [contextCaptureGroup ?? null],
    });
  }

  addRegexPattern(regexPattern = '', id?: number, orderIndex?: number, patternStage: string = PatternStage.MAIN, contextCaptureGroup?: number): void {
    this.regexPatterns.push(this.createRegexPatternGroup(regexPattern, id, orderIndex, patternStage, contextCaptureGroup));
    this.regexValidations.push({ isValid: true });
    if (regexPattern) this.validateRegexAtIndex(this.regexPatterns.length - 1);
  }

  removeRegexPattern(index: number): void {
    if (this.regexPatterns.length > 1) {
      this.regexPatterns.removeAt(index);
      this.regexValidations.splice(index, 1);
      this.regexPatterns.controls.forEach((control, idx) => control.get('orderIndex')?.setValue(idx));
    }
  }

  // ==================== Regex Validation ====================

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
    if (strategy === EvaluationStrategy.SINGLE_STAGE) return patterns.every((p) => p.patternStage === PatternStage.MAIN);
    if (strategy === EvaluationStrategy.MULTI_STAGE) return patterns.some((p) => p.patternStage === PatternStage.MAIN);
    if (strategy === EvaluationStrategy.MULTI_STAGE_EXCLUSIVE) {
      return patterns.some((p) => p.patternStage === PatternStage.MAIN) && patterns.some((p) => p.patternStage === PatternStage.SECOND_STAGE) && patterns.some((p) => p.patternStage === PatternStage.PARAM);
    }
    return true;
  }

  getStrategyValidationError(): string | null {
    const strategy = this.selectedEvaluationStrategy;
    const patterns = this.regexPatterns.value as RegexPatternVO[];
    if (strategy === EvaluationStrategy.SINGLE_STAGE && patterns.some((p) => p.patternStage !== PatternStage.MAIN)) {
      return 'SINGLE_STAGE patterns must all have MAIN stage';
    }
    if (strategy === EvaluationStrategy.MULTI_STAGE && !patterns.some((p) => p.patternStage === PatternStage.MAIN)) {
      return 'MULTI_STAGE requires at least one MAIN stage pattern';
    }
    if (strategy === EvaluationStrategy.MULTI_STAGE_EXCLUSIVE) {
      if (!patterns.some((p) => p.patternStage === PatternStage.MAIN)) return 'Requires at least one MAIN stage pattern';
      if (!patterns.some((p) => p.patternStage === PatternStage.SECOND_STAGE)) return 'Requires at least one SECOND_STAGE pattern';
      if (!patterns.some((p) => p.patternStage === PatternStage.PARAM)) return 'Requires at least one PARAM stage pattern';
    }
    return null;
  }

  // ==================== ABAP Code Editor ====================

  onEditorInput(event: Event): void {
    const editor = this.abapEditor?.nativeElement;
    if (!editor) return;
    const cursorOffset = this.getCursorOffset(editor);
    this.abapCode = editor.innerText || '';
    this.simulationResult = null;
    this.updateLineNumbers();
    this.highlightEditor();
    this.setCursorOffset(editor, cursorOffset);
  }

  onEditorScroll(): void {
    const editor = this.abapEditor?.nativeElement;
    const lineNums = this.lineNumbers?.nativeElement;
    if (editor && lineNums) lineNums.scrollTop = editor.scrollTop;
  }

  updateLineNumbers(): void {
    const lineCount = (this.abapCode || '').split('\n').length;
    this.lineNumbersArray = Array.from({ length: Math.max(1, lineCount) }, (_, i) => i + 1);
  }

  onEditorPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
  }

  highlightEditor(): void {
    const editor = this.abapEditor?.nativeElement;
    if (!editor) return;
    const code = this.abapCode || '';
    if (!code) {
      editor.innerHTML = '';
      return;
    }
    // Simple ABAP keyword highlighting without Prism dependency
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const keywords = /\b(REPORT|PROGRAM|DATA|TYPES|CONSTANTS|TABLES|CLASS|METHOD|FUNCTION|FORM|ENDFORM|PERFORM|CALL|IF|ELSE|ELSEIF|ENDIF|CASE|WHEN|OTHERS|ENDCASE|LOOP|ENDLOOP|WHILE|ENDWHILE|DO|ENDDO|APPEND|CHECK|CONTINUE|EXIT|MESSAGE|RAISE|RETURN|SORT|CONCATENATE|FIND|REPLACE|SPLIT|MOVE|CLEAR|REFRESH|FREE|WRITE|READ|MODIFY|DELETE|INSERT|UPDATE|SELECT|FROM|INTO|WHERE|ORDER|BY|INNER|LEFT|JOIN|COMMIT|ROLLBACK|BEGIN|END|OF|TABLE|TYPE|REF|TO|LIKE|VALUE|INITIAL|STANDARD|WITH|KEY|PUBLIC|PRIVATE|PROTECTED|SECTION|CREATE|OBJECT|NEW|TRY|CATCH|ENDTRY|EXPORTING|IMPORTING|CHANGING|RETURNING|USING)\b/gi;
    const highlighted = escaped
      .replace(keywords, '<span class="kw">$1</span>')
      .replace(/'(?:''|[^'])*'/g, '<span class="str">$&</span>')
      .replace(/^(\*.*)$/gm, '<span class="cmt">$1</span>');
    editor.innerHTML = highlighted;
  }

  private getCursorOffset(element: HTMLElement): number {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  }

  private setCursorOffset(element: HTMLElement, offset: number): void {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    let currentOffset = 0;
    const walkNodes = (node: Node): boolean => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent?.length || 0;
        if (currentOffset + textLength >= offset) {
          range.setStart(node, offset - currentOffset);
          range.collapse(true);
          return true;
        }
        currentOffset += textLength;
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          if (walkNodes(node.childNodes[i])) return true;
        }
      }
      return false;
    };
    if (walkNodes(element)) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  loadSampleCode(): void {
    this.abapCode = this.sampleAbapCode;
    this.updateLineNumbers();
    this.highlightEditor();
    this.simulationResult = null;
  }

  clearCode(): void {
    this.abapCode = '';
    this.updateLineNumbers();
    this.highlightEditor();
    this.simulationResult = null;
  }

  // ==================== Simulation Engine ====================

  runSimulation(): void {
    if (!this.abapCode.trim()) {
      this.notification.error('Please enter ABAP code to test');
      return;
    }
    if (this.regexPatterns.length === 0) {
      this.notification.error('Please add at least one regex pattern');
      return;
    }

    this.isSimulating = true;
    const patterns = this.regexPatterns.value as RegexPatternVO[];
    const strategy = this.selectedEvaluationStrategy;
    const cleanedCode = this.stripAbapComments(this.abapCode);
    const lines = cleanedCode.split('\n');

    const stageResults: StageResult[] = [];
    const matchedLines: number[] = [];

    const mainPatterns = patterns.filter((p) => p.patternStage === PatternStage.MAIN);
    const secondStagePatterns = patterns.filter((p) => p.patternStage === PatternStage.SECOND_STAGE);
    const paramPatterns = patterns.filter((p) => p.patternStage === PatternStage.PARAM);

    const mainMatches = this.runStageMatching(lines, mainPatterns, 'MAIN');
    stageResults.push({ stage: 'MAIN', matches: mainMatches, passed: mainMatches.length > 0 });
    mainMatches.forEach((m) => {
      if (!matchedLines.includes(m.lineNumber)) matchedLines.push(m.lineNumber);
    });

    if (strategy !== EvaluationStrategy.SINGLE_STAGE && mainMatches.length > 0) {
      if (secondStagePatterns.length > 0) {
        const secondMatches: SimulationMatch[] = [];
        const secondStageContexts = new Map<SimulationMatch, string>();

        for (const mainMatch of mainMatches) {
          const context = this.extractContext(mainMatch.matchedText, mainPatterns);
          const validated = this.runContextMatching(context, secondStagePatterns, 'SECOND_STAGE', mainMatch);
          if (validated.length > 0) {
            secondMatches.push(...validated);
            secondStageContexts.set(mainMatch, context);
          }
        }

        stageResults.push({ stage: 'SECOND_STAGE', matches: secondMatches, passed: secondMatches.length > 0 });
        secondMatches.forEach((m) => {
          if (!matchedLines.includes(m.lineNumber)) matchedLines.push(m.lineNumber);
        });

        if (strategy === EvaluationStrategy.MULTI_STAGE_EXCLUSIVE && paramPatterns.length > 0 && secondMatches.length > 0) {
          const paramMatches: SimulationMatch[] = [];
          for (const mainMatch of mainMatches) {
            const secondContext = secondStageContexts.get(mainMatch);
            if (!secondContext) continue;
            const paramContext = this.extractContext(secondContext, secondStagePatterns);
            const validated = this.runContextMatching(paramContext, paramPatterns, 'PARAM', mainMatch);
            if (validated.length > 0) paramMatches.push(...validated);
          }
          stageResults.push({ stage: 'PARAM', matches: paramMatches, passed: paramMatches.length > 0 });
          paramMatches.forEach((m) => {
            if (!matchedLines.includes(m.lineNumber)) matchedLines.push(m.lineNumber);
          });
        }
      }
    }

    let finalVerdict: 'DETECTED' | 'NOT_DETECTED' | 'PARTIAL' = 'NOT_DETECTED';
    const allPassed = stageResults.every((s) => s.passed);
    const somePassed = stageResults.some((s) => s.passed);

    if (strategy === EvaluationStrategy.SINGLE_STAGE) {
      finalVerdict = mainMatches.length > 0 ? 'DETECTED' : 'NOT_DETECTED';
    } else {
      if (allPassed) finalVerdict = 'DETECTED';
      else if (somePassed) finalVerdict = 'PARTIAL';
    }

    this.simulationResult = {
      totalMatches: stageResults.reduce((sum, s) => sum + s.matches.length, 0),
      stageResults,
      finalVerdict,
      matchedLines: matchedLines.sort((a, b) => a - b),
    };
    this.isSimulating = false;
  }

  private runStageMatching(lines: string[], patterns: RegexPatternVO[], stage: string): SimulationMatch[] {
    const matches: SimulationMatch[] = [];
    patterns.forEach((pattern, patternIndex) => {
      try {
        const jsPattern = this.stripJavaRegexModifiers(pattern.regexPattern);
        const regex = new RegExp(jsPattern, 'gims');
        const fullCode = lines.join('\n');
        let match;
        while ((match = regex.exec(fullCode)) !== null) {
          const beforeMatch = fullCode.substring(0, match.index);
          const lineNumber = beforeMatch.split('\n').length;
          const captureGroups = match.slice(1).filter((g: any) => g !== undefined);
          matches.push({ lineNumber, lineContent: lines[lineNumber - 1] || '', matchedText: match[0], captureGroups, stage, patternIndex });
          if (match.index === regex.lastIndex) regex.lastIndex++;
        }
      } catch (e) {
        // skip invalid pattern
      }
    });
    return matches;
  }

  private stripAbapComments(code: string): string {
    return code
      .split('\n')
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('*') || trimmed.startsWith('"')) return '';
        return line;
      })
      .join('\n');
  }

  private extractContext(text: string, patterns: RegexPatternVO[]): string {
    for (const pattern of patterns) {
      if (pattern.contextCaptureGroup != null) {
        try {
          const jsPattern = this.stripJavaRegexModifiers(pattern.regexPattern);
          const regex = new RegExp(jsPattern, 'ims');
          const match = regex.exec(text);
          if (match && match[pattern.contextCaptureGroup]) return match[pattern.contextCaptureGroup];
        } catch (e) {
          /* skip */
        }
      }
    }
    return text;
  }

  private runContextMatching(context: string, patterns: RegexPatternVO[], stage: string, original: SimulationMatch): SimulationMatch[] {
    const matches: SimulationMatch[] = [];
    for (const [patternIndex, pattern] of patterns.entries()) {
      try {
        const jsPattern = this.stripJavaRegexModifiers(pattern.regexPattern);
        const regex = new RegExp(jsPattern, 'ims');
        if (regex.test(context)) {
          matches.push({ lineNumber: original.lineNumber, lineContent: original.lineContent, matchedText: context, captureGroups: [], stage, patternIndex });
          break;
        }
      } catch (e) {
        /* skip */
      }
    }
    return matches;
  }

  clearSimulation(): void {
    this.simulationResult = null;
  }

  // ==================== Save ====================

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
          this.router.navigate(['/sap-abap-scanner/detection-patterns']);
        },
        error: (err: any) => {
          this.isSaving = false;
          this.notification.error(err.error?.message || 'Error saving pattern');
        },
      });
    } else if (!this.allPatternsValid) {
      const error = this.getStrategyValidationError();
      this.notification.error(error || 'Please fix invalid regex patterns before saving');
    }
  }

  goBack(): void {
    this.router.navigate(['/sap-abap-scanner/detection-patterns']);
  }

  // ==================== Resizable Panel ====================

  startResize(event: MouseEvent): void {
    this.isResizing = true;
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isResizing) return;
    const newWidth = event.clientX;
    if (newWidth >= this.minPanelWidth && newWidth <= this.maxPanelWidth) {
      this.leftPanelWidth = newWidth;
    }
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isResizing = false;
  }

  // ==================== UI Helpers ====================

  getStageColor(stage: string): string {
    switch (stage) {
      case 'MAIN': return '#1890ff';
      case 'SECOND_STAGE': return '#722ed1';
      case 'PARAM': return '#fa8c16';
      default: return '#8c8c8c';
    }
  }

  getVerdictClass(): string {
    if (!this.simulationResult) return '';
    switch (this.simulationResult.finalVerdict) {
      case 'DETECTED': return 'verdict-detected';
      case 'NOT_DETECTED': return 'verdict-not-detected';
      case 'PARTIAL': return 'verdict-partial';
      default: return '';
    }
  }

  getVerdictIcon(): string {
    if (!this.simulationResult) return 'question-circle';
    switch (this.simulationResult.finalVerdict) {
      case 'DETECTED': return 'warning';
      case 'NOT_DETECTED': return 'check-circle';
      case 'PARTIAL': return 'info-circle';
      default: return 'question-circle';
    }
  }

  getVerdictText(): string {
    if (!this.simulationResult) return '';
    switch (this.simulationResult.finalVerdict) {
      case 'DETECTED': return 'VULNERABILITY DETECTED';
      case 'NOT_DETECTED': return 'NO MATCH FOUND';
      case 'PARTIAL': return 'PARTIAL MATCH';
      default: return '';
    }
  }
}
