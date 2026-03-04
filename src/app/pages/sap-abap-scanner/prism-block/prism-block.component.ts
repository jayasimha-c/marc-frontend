import {
  Component, Input, OnChanges, AfterViewInit,
  ViewChild, ElementRef, SimpleChanges
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  standalone: false,
  selector: 'prism-block',
  templateUrl: './prism-block.component.html',
  styleUrls: ['./prism-block.component.scss'],
})
export class PrismBlockComponent implements OnChanges, AfterViewInit {
  @Input() code = '';
  @Input() language = 'abap';
  @Input() match?: string;
  @Input() pattern?: string;
  @Input() lineNumbers = false;
  @Input() startLine = 1;
  @Input() customLineNumbers?: number[];

  lineNumbersList: number[] = [];
  processedHtml: SafeHtml = '';

  @ViewChild('lineNumbersEl') lineNumbersEl?: ElementRef<HTMLDivElement>;
  @ViewChild('codeEl') codeEl?: ElementRef<HTMLPreElement>;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.processCode();
  }

  ngAfterViewInit(): void {
    this.syncScroll();
  }

  onCodeScroll(): void {
    if (this.lineNumbersEl && this.codeEl) {
      this.lineNumbersEl.nativeElement.scrollTop = this.codeEl.nativeElement.scrollTop;
    }
  }

  private processCode(): void {
    const lines = (this.code || '').split('\n');

    // Build line numbers
    if (this.customLineNumbers) {
      this.lineNumbersList = this.customLineNumbers.slice(0, lines.length);
    } else {
      this.lineNumbersList = lines.map((_, i) => this.startLine + i);
    }

    // Escape HTML entities first
    let html = this.escapeHtml(this.code);

    // Apply match/pattern highlighting
    if (this.pattern) {
      html = this.highlightPattern(html, this.pattern);
    } else if (this.match) {
      html = this.highlightLiteral(html, this.match);
    }

    this.processedHtml = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private highlightLiteral(html: string, match: string): string {
    const escapedMatch = this.escapeHtml(match);
    const regexSafe = escapedMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      return html.replace(new RegExp(regexSafe, 'gi'), (m) =>
        `<mark class="code-highlight">${m}</mark>`
      );
    } catch {
      return html;
    }
  }

  private highlightPattern(html: string, pattern: string): string {
    try {
      return html.replace(new RegExp(pattern, 'gi'), (m) =>
        `<mark class="code-highlight">${m}</mark>`
      );
    } catch {
      return html;
    }
  }

  private syncScroll(): void {
    if (!this.codeEl) return;
    this.codeEl.nativeElement.addEventListener('scroll', () => this.onCodeScroll());
  }

  /** Max digit width for line number padding */
  getLineNumberWidth(): number {
    if (this.lineNumbersList.length === 0) return 3;
    const max = Math.max(...this.lineNumbersList);
    return Math.max(3, max.toString().length);
  }

  padLineNumber(num: number): string {
    return num.toString().padStart(this.getLineNumberWidth(), ' ');
  }
}
