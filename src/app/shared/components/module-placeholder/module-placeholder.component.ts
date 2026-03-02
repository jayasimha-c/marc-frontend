import { Component, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-module-placeholder',
  template: `
    <div class="module-placeholder">
      <span nz-icon [nzType]="icon" class="placeholder-icon" nzTheme="outline"></span>
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>
  `,
})
export class ModulePlaceholderComponent {
  @Input() title = 'Module';
  @Input() description = 'This module is under development.';
  @Input() icon = 'tool';
}
