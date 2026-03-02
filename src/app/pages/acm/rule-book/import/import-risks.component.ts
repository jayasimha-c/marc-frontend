import { Component } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { RisksService } from '../risks/risks.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { FileSaverService } from '../../../../core/services/file-saver.service';
import { ImportErrorDialogComponent } from './import-error-dialog.component';

@Component({
  standalone: false,
  selector: 'app-import-risks',
  templateUrl: './import-risks.component.html',
})
export class ImportRisksComponent {
  uploadProgress: Record<string, boolean> = {};
  uploadSuccess: Record<string, boolean> = {};

  uploadTypes = [
    { key: 'risks', name: 'Risks' },
    { key: 'riskRules', name: 'Risk Rules' },
  ];

  private riskSampleTemplate = [
    { RiskName: 'RiskName24', Description: 'Risk Description1', BusinessProcess: 'BP1', BusinessSubProcess: 'BP1_SP1', RiskType: 'Sensitive', RiskLevel: 'High', CrossSystem: 'false', DetailDescripton: 'Detail Description about Risk or empty value' },
    { RiskName: 'RiskName25', Description: 'Risk Description2', BusinessProcess: 'BP2', BusinessSubProcess: 'BP2_SP1', RiskType: 'SoD', RiskLevel: 'Low', CrossSystem: 'false', DetailDescripton: 'Detail Description about Risk or empty value' },
    { RiskName: 'RiskName26', Description: 'Risk Description3', BusinessProcess: 'BP3', BusinessSubProcess: 'BP3_SP1', RiskType: 'Sensitive', RiskLevel: 'Medium', CrossSystem: 'false', DetailDescripton: 'Detail Description about Risk or empty value' },
    { RiskName: 'RiskName22', Description: 'Risk Description4', BusinessProcess: 'BP4', BusinessSubProcess: 'BP4_SP1', RiskType: 'SoD', RiskLevel: 'High', CrossSystem: 'false', DetailDescripton: 'Detail Description about Risk or empty value' },
    { RiskName: 'RiskName23', Description: 'Risk Description5', BusinessProcess: 'BP2', BusinessSubProcess: 'BP2_SP1', RiskType: 'Sensitive', RiskLevel: 'Critical', CrossSystem: 'false', DetailDescripton: 'Detail Description about Risk or empty value' },
  ];

  private riskRuleSampleTemplate = [
    { RiskName: 'RiskName24', RiskCondition: 'RuleName24 AND RuleName25' },
    { RiskName: 'RiskName25', RiskCondition: 'RuleName26 OR RuleName22' },
    { RiskName: 'RiskName26', RiskCondition: 'RuleName23 AND RuleName24 AND RuleName25' },
    { RiskName: 'RiskName22', RiskCondition: 'RuleName23 AND RuleName25' },
    { RiskName: 'RiskName23', RiskCondition: 'RuleName26 OR RuleName24' },
  ];

  constructor(
    private risksService: RisksService,
    private notify: NotificationService,
    private fileSaver: FileSaverService,
    private modal: NzModalService,
  ) {}

  onClickRiskTemplate(): void {
    this.generateAndDownload(this.riskSampleTemplate, 'RiskSample');
  }

  onClickRiskRuleTemplate(): void {
    this.generateAndDownload(this.riskRuleSampleTemplate, 'RiskRuleSample');
  }

  getBeforeUpload(uploadType: string): (file: NzUploadFile) => boolean {
    return (file: NzUploadFile): boolean => {
      const raw = file as any;
      if (!this.validateFile(raw)) return false;

      this.uploadProgress[uploadType] = true;
      this.uploadSuccess[uploadType] = false;
      const formData = new FormData();
      formData.append('fileUpload', raw);

      if (uploadType === 'risks') {
        this.risksService.uploadRisks(formData).subscribe({
          next: (res) => {
            this.uploadProgress[uploadType] = false;
            if (res.success) {
              this.uploadSuccess[uploadType] = true;
              this.notify.success(res.message || 'Risks uploaded successfully');
              this.clearSuccessAfterDelay(uploadType);
              const errorMessages = res.errorMessages || res.data?.errorMessages;
              if (errorMessages?.length) {
                this.showErrorMessagesDialog('Risk Import Warnings', errorMessages);
              }
            } else {
              this.notify.error(res.data?.message || res.message || 'Upload failed');
            }
          },
          error: (err) => this.handleError(err, uploadType),
        });
      } else {
        this.risksService.uploadRiskRules(formData).subscribe({
          next: (res) => {
            this.uploadProgress[uploadType] = false;
            if (res.success) {
              this.uploadSuccess[uploadType] = true;
              this.notify.success('Risk rules uploaded successfully');
              this.clearSuccessAfterDelay(uploadType);
            } else {
              this.notify.error(res.data?.message || 'Upload failed');
            }
          },
          error: (err) => this.handleError(err, uploadType),
        });
      }
      return false;
    };
  }

  private handleError(err: any, uploadType: string): void {
    this.uploadProgress[uploadType] = false;
    this.notify.error(err.error?.message || 'Upload failed. Please try again.');
  }

  private validateFile(file: File): boolean {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.xlsx', '.xls'].includes(ext)) {
      this.notify.error('Please upload only Excel files (.xlsx, .xls)');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.notify.error('File size must be less than 10MB');
      return false;
    }
    return true;
  }

  private clearSuccessAfterDelay(uploadType: string): void {
    setTimeout(() => { this.uploadSuccess[uploadType] = false; }, 5000);
  }

  private showErrorMessagesDialog(title: string, errorMessages: string[]): void {
    this.modal.create({
      nzTitle: title,
      nzContent: ImportErrorDialogComponent,
      nzWidth: '600px',
      nzFooter: null,
      nzData: { title, errorMessages },
    });
  }

  private generateAndDownload(data: any[], filename: string): void {
    import('xlsx').then((XLSX) => {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = { Sheets: { data: ws }, SheetNames: ['data'] };
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      this.fileSaver.saveExcel(filename, buf);
    });
  }
}
