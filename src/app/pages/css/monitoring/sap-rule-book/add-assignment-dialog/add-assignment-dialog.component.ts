import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { CssMonitoringService } from '../../css-monitoring.service';
import { RuleBookAssignment, SapRuleBook } from '../../css-monitoring.model';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-add-assignment-dialog',
  templateUrl: './add-assignment-dialog.component.html',
})
export class AddAssignmentDialogComponent implements OnInit {
  ruleBook: SapRuleBook;
  assignment: RuleBookAssignment | null = null;
  isEdit = false;

  systems: any[] = [];
  selectedSystemId: number | null = null;
  enableSchedule = false;
  startDate: Date | null = null;
  endDate: Date | null = null;
  repeatPeriodically = false;
  repeatAfterDays = 0;
  repeatAfterHours = 0;
  repeatAfterMinutes = 0;

  dayOptions = Array.from({ length: 32 }, (_, i) => i);
  hourOptions = Array.from({ length: 24 }, (_, i) => i);
  minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  saving = false;

  constructor(
    public modal: NzModalRef,
    @Inject(NZ_MODAL_DATA) public data: { ruleBook: SapRuleBook; assignment?: RuleBookAssignment },
    private cssService: CssMonitoringService,
    private notificationService: NotificationService,
  ) {
    this.ruleBook = data.ruleBook;
    if (data.assignment) {
      this.assignment = data.assignment;
      this.isEdit = true;
    }
  }

  ngOnInit(): void {
    this.loadSystems();
    if (this.isEdit && this.assignment) {
      this.selectedSystemId = this.assignment.sapSystemId;
      this.enableSchedule = this.assignment.enabled;
      this.startDate = this.assignment.startDate ? new Date(this.assignment.startDate) : null;
      this.endDate = this.assignment.endDate ? new Date(this.assignment.endDate) : null;
      this.repeatPeriodically = this.assignment.repeatPeriodically;
      this.repeatAfterDays = this.assignment.repeatAfterDays || 0;
      this.repeatAfterHours = this.assignment.repeatAfterHours || 0;
      this.repeatAfterMinutes = this.assignment.repeatAfterMinutes || 0;
    }
  }

  loadSystems(): void {
    this.cssService.getSystemList(this.ruleBook.ruleType).subscribe((res) => {
      if (res.success) {
        this.systems = res.data || [];
      }
    });
  }

  onSave(): void {
    if (!this.selectedSystemId) {
      this.notificationService.warn('Please select a system.');
      return;
    }
    if (this.enableSchedule && !this.startDate) {
      this.notificationService.warn('Please select a start date.');
      return;
    }
    if (this.enableSchedule && this.repeatPeriodically
        && this.repeatAfterDays === 0 && this.repeatAfterHours === 0 && this.repeatAfterMinutes === 0) {
      this.notificationService.warn('Please set a repeat interval.');
      return;
    }

    this.saving = true;
    const payload: RuleBookAssignment = {
      id: this.isEdit && this.assignment ? this.assignment.id : null,
      ruleBookId: this.ruleBook.id!,
      sapSystemId: this.selectedSystemId,
      ruleType: this.ruleBook.ruleType,
      enabled: this.enableSchedule,
      startDate: this.enableSchedule && this.startDate ? this.startDate.toISOString() : null,
      endDate: this.enableSchedule && this.endDate ? this.endDate.toISOString() : null,
      repeatPeriodically: this.enableSchedule ? this.repeatPeriodically : false,
      repeatAfterDays: this.enableSchedule ? this.repeatAfterDays : 0,
      repeatAfterHours: this.enableSchedule ? this.repeatAfterHours : 0,
      repeatAfterMinutes: this.enableSchedule ? this.repeatAfterMinutes : 0,
      lastExecutionTime: this.isEdit && this.assignment ? this.assignment.lastExecutionTime : null,
      nextExecutionTime: null,
    };

    this.cssService.saveAssignment(payload).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          this.notificationService.success(res.message || 'Assignment saved.');
          this.modal.close(true);
        } else {
          this.notificationService.error(res.message || 'Failed to save assignment.');
        }
      },
      error: () => {
        this.saving = false;
        this.notificationService.error('Failed to save assignment.');
      },
    });
  }

  onCancel(): void {
    this.modal.close(false);
  }
}
