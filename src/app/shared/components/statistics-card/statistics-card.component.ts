import { Component, Input, HostBinding } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-statistics-card',
  templateUrl: './statistics-card.component.html',
  styleUrls: ['./statistics-card.component.scss']
})
export class StatisticsCardComponent {
  @Input() title!: string;
  @Input() value!: string | number;
  @Input() loading = false;
  @Input() description = '';
  @Input() icon = 'info-circle';
  @Input() color = '#1890ff';
  @Input() selected = false;
  @Input() clickable = false;

  @HostBinding('class.stat-card--selected') get isSelected() { return this.selected; }
  @HostBinding('class.stat-card--clickable') get isClickable() { return this.clickable; }
  @HostBinding('style.display') display = 'block';
}
