import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';

export interface PanelAction {
  label: string;
  icon?: string;
  color?: 'primary' | 'accent' | 'warn' | '';
  disabled?: boolean;
}

@Component({
  standalone: false,
  selector: 'app-side-panel',
  templateUrl: './side-panel.component.html',
  styleUrls: ['./side-panel.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SidePanelComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = 'file-text';
  @Input() width = '480px';
  @Input() position: 'start' | 'end' = 'end';
  @Input() closeOnBackdropClick = true;
  @Input() showFooter = true;
  @Input() primaryAction: PanelAction | null = null;
  @Input() secondaryAction: PanelAction | null = { label: 'Close' };
  @Input() loading = false;
  @Input() loadingMessage = 'Loading...';

  private _isOpen = false;

  @Output() closed = new EventEmitter<void>();
  @Output() primaryClick = new EventEmitter<void>();
  @Output() secondaryClick = new EventEmitter<void>();
  @Output() opened = new EventEmitter<void>();

  get isOpen(): boolean {
    return this._isOpen;
  }

  open(): void {
    if (!this._isOpen) {
      this._isOpen = true;
      this.opened.emit();
    }
  }

  close(): void {
    if (this._isOpen) {
      this._isOpen = false;
      this.closed.emit();
    }
  }

  toggle(): void {
    this._isOpen ? this.close() : this.open();
  }

  onCloseClick(): void {
    this.close();
  }

  onBackdropClick(): void {
    if (this.closeOnBackdropClick) this.close();
  }

  onPrimaryClick(): void {
    this.primaryClick.emit();
  }

  onSecondaryClick(): void {
    this.secondaryClick.emit();
    if (!this.primaryAction) this.close();
  }
}
