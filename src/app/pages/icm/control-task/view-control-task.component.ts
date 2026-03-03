import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IcmControlService } from '../icm-control.service';
import { formatTaskStatus } from '../utils/status-utils';

@Component({
  standalone: false,
  selector: 'app-view-control-task',
  templateUrl: './view-control-task.component.html',
})
export class ViewControlTaskComponent implements OnInit {
  controlId: any;
  control: any;
  loading = true;
  detailsExpanded = true;
  tasks: any[] = [];

  dropdownData: Record<string, any[]> = {
    sapSystemList: [], bpList: [], sbpList: [], regulationList: [],
    groupList: [], categoryList: [], impactList: [], typeList: [], criticallyList: [],
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private icmService: IcmControlService,
  ) {}

  ngOnInit(): void {
    this.controlId = this.route.snapshot.paramMap.get('controlId');
    this.loadDropdownData();
    this.loadControl();
  }

  private loadControl(): void {
    this.icmService.getControlById(this.controlId).subscribe({
      next: (res) => {
        if (res?.data) {
          this.control = res.data;
          this.loadSubProcesses(res.data);
          this.loadTasks();
        }
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  private loadSubProcesses(control: any): void {
    const bpId = control?.businessProcess?.id;
    if (bpId) {
      this.icmService.getBusinessSubProcesses(bpId).subscribe({
        next: (res) => { this.dropdownData['sbpList'] = res.data?.rows || []; },
      });
    }
  }

  private loadTasks(): void {
    this.icmService.getManualActiveTasks(this.controlId).subscribe({
      next: (res) => {
        this.tasks = (res.data?.rows || []).map((row: any) => ({
          ...row,
          statusLabel: formatTaskStatus(row.status),
        }));
      },
      error: () => { this.tasks = []; },
    });
  }

  private loadDropdownData(): void {
    const load = (method: string, field: string, useRows = true) => {
      (this.icmService as any)[method]().subscribe({
        next: (res: any) => {
          this.dropdownData[field] = useRows ? (res.data?.rows || []) : (res.data?.rows || res.data || []);
        },
        error: () => { this.dropdownData[field] = []; },
      });
    };
    load('getCriticalityList', 'criticallyList');
    load('getSAPSystemList', 'sapSystemList', false);
    load('getBPList', 'bpList');
    load('getRegulationList', 'regulationList');
    load('getGroupList', 'groupList');
    load('getCategoryList', 'categoryList');
    load('getImpactList', 'impactList');
    load('getControlTypeList', 'typeList');
  }

  getSystemName(): string {
    const id = this.control?.sapSystemId;
    const sys = this.dropdownData['sapSystemList']?.find((s: any) => s.id === id || s[0] === id);
    return sys?.name || sys?.sid || (Array.isArray(sys) ? sys[1] : null) || id || '-';
  }

  getLookupName(field: string, listKey: string): string {
    let fieldValue = this.control?.[field];
    if (Array.isArray(fieldValue)) fieldValue = fieldValue[0];
    const id = fieldValue?.id ?? fieldValue;
    const item = this.dropdownData[listKey]?.find((i: any) => i.id === id);
    return item?.name || fieldValue?.name || '-';
  }

  getStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'CREATED': return 'blue';
      case 'OPENED': return 'orange';
      case 'CLOSED': return 'green';
      case 'FAILED': return 'red';
      case 'OVERDUE': return 'volcano';
      case 'DRAFT': return 'default';
      default: return 'default';
    }
  }

  answerTask(taskId: number): void {
    this.router.navigate([`/icm/answer-control-task/${taskId}`]);
  }

  goBack(): void {
    this.router.navigate(['/icm/control-tasks']);
  }
}
