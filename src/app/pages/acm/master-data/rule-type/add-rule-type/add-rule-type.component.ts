import { Component, Inject } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { RuleTypeService } from '../rule-type.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-add-rule-type',
  templateUrl: './add-rule-type.component.html',
})
export class AddRuleTypeComponent {
  ruleType = '';
  formType: string;
  isSaving = false;

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    private ruleTypeService: RuleTypeService,
    private notificationService: NotificationService,
    public modal: NzModalRef,
  ) {
    this.formType = this.dialogData.formType;
    if (this.formType === 'Edit' && this.dialogData.data) {
      this.ruleType = this.dialogData.data.name;
    }
  }

  save(): void {
    if (!this.ruleType.trim()) {
      this.notificationService.error('Enter Rule Type');
      return;
    }

    this.isSaving = true;
    const payload: any = { name: this.ruleType.trim() };

    if (this.formType === 'Edit' && this.dialogData.data) {
      payload.id = this.dialogData.data.id;
    }

    this.ruleTypeService.saveRuleType(payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) {
          this.notificationService.success(this.formType === 'Edit' ? 'Updated successfully' : 'Saved successfully');
          this.modal.close(true);
        } else {
          this.notificationService.error(res.message || 'Save failed');
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.notificationService.error(err.error?.message || 'Save failed');
      },
    });
  }
}
