import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { RulesService } from '../rules.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-map-bpmn-task',
  templateUrl: './map-bpmn-task.component.html',
})
export class MapBpmnTaskComponent implements OnInit {
  form!: FormGroup;
  bpmnList: any[] = [];
  taskList: any[] = [];

  constructor(
    @Inject(NZ_MODAL_DATA) private data: any,
    private fb: FormBuilder,
    private rulesService: RulesService,
    private notificationService: NotificationService,
    public modalRef: NzModalRef,
  ) {}

  ngOnInit(): void {
    this.bpmnList = this.data?.bpmnList || [];
    this.form = this.fb.group({
      ruleId: [this.data?.ruleId],
      ruleName: [{ value: this.data?.ruleName || '', disabled: true }],
      processId: ['', Validators.required],
      taskId: ['', Validators.required],
    });
  }

  onProcessChange(processId: number): void {
    this.taskList = [];
    this.form.get('taskId')?.reset();
    if (processId) {
      this.rulesService.getBpmnTasks(processId).subscribe((res: any) => {
        this.taskList = res.data || [];
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => { c.markAsTouched(); c.updateValueAndValidity(); });
      return;
    }
    this.rulesService.saveBpmnRuleMap(this.form.getRawValue()).subscribe({
      next: (res: any) => {
        this.notificationService.show(res);
        this.modalRef.close(true);
      },
      error: (err: any) => {
        this.notificationService.error(err.error?.message || 'Failed to map BPMN task');
      },
    });
  }
}
