import { Component } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-icm',
  template: `
    <div style="padding: 24px;">
      <h2 style="margin-bottom: 4px;">
        <span nz-icon nzType="reconciliation" nzTheme="outline" style="margin-right: 8px;"></span>
        Internal Control Management
      </h2>
      <p nz-typography nzType="secondary" style="margin-bottom: 24px;">Manage controls, rules, and compliance execution</p>

      <div nz-row [nzGutter]="[16, 16]">
        <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8" [nzLg]="6" *ngFor="let card of navCards">
          <nz-card [nzHoverable]="true" [routerLink]="card.route" style="height: 100%; cursor: pointer;">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <span nz-icon [nzType]="card.icon" nzTheme="outline"
                style="font-size: 28px; color: #1890ff; margin-top: 2px;"></span>
              <div>
                <div style="font-weight: 600; font-size: 15px; margin-bottom: 4px;">{{ card.title }}</div>
                <div nz-typography nzType="secondary" style="font-size: 13px;">{{ card.description }}</div>
              </div>
            </div>
          </nz-card>
        </div>
      </div>
    </div>
  `,
})
export class IcmComponent {
  navCards = [
    {
      title: 'Master Data',
      description: 'Manage business processes, criticality levels, and other reference data',
      icon: 'database',
      route: '/icm/master-data',
    },
    {
      title: 'Controls',
      description: 'View, create, and manage automated and manual controls',
      icon: 'control',
      route: '/icm/controls',
    },
    {
      title: 'Control Books',
      description: 'Organize controls into books for structured management',
      icon: 'book',
      route: '/icm/control-books',
    },
    {
      title: 'Control Deficiency',
      description: 'Track and manage deficiencies found during control execution',
      icon: 'warning',
      route: '/icm/control-deficiency',
    },
    {
      title: 'Control Results',
      description: 'View execution results for automated and manual controls',
      icon: 'bar-chart',
      route: '/icm/control-results',
    },
    {
      title: 'Schedulers',
      description: 'Schedule and automate control execution',
      icon: 'clock-circle',
      route: '/icm/schedulers',
    },
  ];
}
