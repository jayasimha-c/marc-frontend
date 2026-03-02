import { Component, Input } from '@angular/core';

export interface PagePanelAction {
  label: string;
  icon?: string;
  command?: () => void;
}

@Component({
  standalone: false,
  selector: 'app-page-panel',
  templateUrl: './page-panel.component.html',
  styleUrls: ['./page-panel.component.scss']
})
export class PagePanelComponent {
  @Input() header = '';
  @Input() actionBtnList: PagePanelAction[] = [];
}
