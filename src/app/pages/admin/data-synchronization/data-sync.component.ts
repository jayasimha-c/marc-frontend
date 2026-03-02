import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-admin-data-sync',
  templateUrl: './data-sync.component.html',
  styleUrls: ['./data-sync.component.scss'],
})
export class DataSyncComponent implements OnInit {
  tabs = [
    { label: 'Schedulers', route: 'schedulers', icon: 'clock-circle' },
    { label: 'Sync Jobs', route: 'jobs', icon: 'history' },
  ];

  activeTab = 0;

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const url = this.router.url;
    this.activeTab = this.tabs.findIndex(t => url.includes(t.route));
    if (this.activeTab < 0) this.activeTab = 0;
  }

  onTabChange(event: any): void {
    const tab = this.tabs[event.index];
    if (tab) {
      this.router.navigate([tab.route], { relativeTo: this.route });
    }
  }
}
