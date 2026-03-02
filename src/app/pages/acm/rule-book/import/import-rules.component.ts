import { Component } from '@angular/core';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { RulesService } from '../rules/rules.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { FileSaverService } from '../../../../core/services/file-saver.service';

@Component({
  standalone: false,
  selector: 'app-import-rules',
  templateUrl: './import-rules.component.html',
})
export class ImportRulesComponent {
  uploadProgress: Record<string, boolean> = {};
  uploadSuccess: Record<string, boolean> = {};

  uploadTypes = [
    { key: 'rules', name: 'Rules' },
    { key: 'ruleObjectsAppend', name: 'Rule Objects (Append)' },
    { key: 'ruleObjectsOverwrite', name: 'Rule Objects (Overwrite)' },
  ];

  private ruleTemplateData = [
    { RuleName: 'RULE_001', Description: 'Sample rule description', BusinessProcess: 'Finance', BusinessSubProcess: 'Accounts Payable', RuleType: 'SOD' },
    { RuleName: 'RULE_002', Description: 'Another rule description', BusinessProcess: 'HR', BusinessSubProcess: 'Payroll', RuleType: 'Critical' },
  ];

  private ruleObjectTemplateData = [
    { RuleName: 'RULE_001', Object: 'TCODE', Field: 'TCODE', Value: 'FB01', JoinByAnd: 'true' },
    { RuleName: 'RULE_001', Object: 'TCODE', Field: 'TCODE', Value: 'FB02', JoinByAnd: 'false' },
    { RuleName: 'RULE_002', Object: 'AUTH', Field: 'ACTVT', Value: '01', JoinByAnd: 'true' },
  ];

  constructor(
    private rulesService: RulesService,
    private notify: NotificationService,
    private fileSaver: FileSaverService,
  ) {}

  onClickRuleTemplate(): void {
    this.generateAndDownload(this.ruleTemplateData, 'RuleSample');
  }

  onClickRuleObjectTemplate(): void {
    this.generateAndDownload(this.ruleObjectTemplateData, 'RuleObjectSample');
  }

  getBeforeUpload(uploadType: string): (file: NzUploadFile) => boolean {
    return (file: NzUploadFile): boolean => {
      const raw = file as any;
      if (!this.validateFile(raw)) return false;

      this.uploadProgress[uploadType] = true;
      this.uploadSuccess[uploadType] = false;
      const formData = new FormData();
      formData.append('fileUpload', raw);

      if (uploadType === 'rules') {
        this.rulesService.uploadRules(formData).subscribe({
          next: (res) => this.handleResponse(res, uploadType),
          error: (err) => this.handleError(err, uploadType),
        });
      } else {
        const overwrite = uploadType === 'ruleObjectsOverwrite';
        this.rulesService.uploadRuleObjects(formData, overwrite).subscribe({
          next: (res) => {
            this.uploadProgress[uploadType] = false;
            if (res.success) {
              this.uploadSuccess[uploadType] = true;
              const action = overwrite ? 'overwritten' : 'appended';
              this.notify.success(`Rule objects ${action} successfully`);
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

  private handleResponse(res: any, uploadType: string): void {
    this.uploadProgress[uploadType] = false;
    if (res.success) {
      this.uploadSuccess[uploadType] = true;
      this.notify.success('Rules uploaded successfully');
      this.clearSuccessAfterDelay(uploadType);
    } else {
      this.notify.error(res.data?.message || 'Upload failed');
    }
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

  private generateAndDownload(data: any[], filename: string): void {
    import('xlsx').then((XLSX) => {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = { Sheets: { data: ws }, SheetNames: ['data'] };
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      this.fileSaver.saveExcel(filename, buf);
    });
  }
}
