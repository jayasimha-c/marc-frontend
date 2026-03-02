import { Component, OnInit } from '@angular/core';
import { ApiResponse } from '../../../core/models/api-response';
import { NotificationService } from '../../../core/services/notification.service';
import { SettingsService } from './settings.service';

interface SettingCategory {
  name: string;
  icon: string;
  description: string;
  settings: any[];
  expanded: boolean;
}

@Component({
  standalone: false,
  selector: 'app-admin-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class AdminSettingsComponent implements OnInit {
  globalCategories: SettingCategory[] = [];
  reportingUnitCategories: SettingCategory[] = [];
  searchTerm = '';
  selectedTab = 0;
  loading = false;

  constructor(
    private settingsService: SettingsService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadGlobalSettings();
    this.loadReportingUnitSettings();
  }

  loadGlobalSettings(): void {
    this.loading = true;
    this.settingsService.getGlobalSettings().subscribe({
      next: (resp: ApiResponse) => {
        if (resp?.data?.rows) {
          this.categorizeGlobalSettings(resp.data.rows);
        }
        this.loading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load global settings');
        this.loading = false;
      }
    });
  }

  loadReportingUnitSettings(): void {
    this.settingsService.getReportingUnitSettings().subscribe({
      next: (resp: ApiResponse) => {
        if (resp?.data?.rows) {
          this.categorizeReportingUnitSettings(resp.data.rows);
        }
      },
      error: () => {
        this.notificationService.error('Failed to load reporting unit settings');
      }
    });
  }

  private categorizeGlobalSettings(settings: any[]): void {
    const categories = new Map<string, any[]>();
    settings.forEach(s => {
      const cat = this.getGlobalSettingCategory(s.name);
      if (!categories.has(cat)) categories.set(cat, []);
      categories.get(cat)!.push(s);
    });

    this.globalCategories = [];
    categories.forEach((items, name) => {
      const info = this.getGlobalCategoryInfo(name);
      this.globalCategories.push({ name, icon: info.icon, description: info.description, settings: items, expanded: false });
    });
  }

  private categorizeReportingUnitSettings(settings: any[]): void {
    const categories = new Map<string, any[]>();
    settings.forEach(s => {
      const cat = s.moduleName || 'General';
      if (!categories.has(cat)) categories.set(cat, []);
      categories.get(cat)!.push(s);
    });

    this.reportingUnitCategories = [];
    categories.forEach((items, name) => {
      const info = this.getReportingUnitCategoryInfo(name);
      this.reportingUnitCategories.push({ name, icon: info.icon, description: info.description, settings: items, expanded: false });
    });
  }

  private getGlobalSettingCategory(parameterName: string): string {
    const n = parameterName.toLowerCase();
    if (n.includes('password')) return 'Password Policy';
    if (n.includes('storage') || n.includes('file')) return 'Storage & Files';
    if (n.includes('auth') || n.includes('login')) return 'Authentication';
    if (n.includes('teams.bot')) return 'Teams Bot';
    if (n.includes('max') || n.includes('limit')) return 'Limits & Quotas';
    return 'General';
  }

  private getGlobalCategoryInfo(name: string): { icon: string; description: string } {
    const map: Record<string, { icon: string; description: string }> = {
      'Password Policy': { icon: 'lock', description: 'Password strength and security requirements' },
      'Storage & Files': { icon: 'database', description: 'File upload and storage configurations' },
      'Authentication': { icon: 'safety-certificate', description: 'Login and authentication settings' },
      'Limits & Quotas': { icon: 'dashboard', description: 'System limits and resource quotas' },
      'Teams Bot': { icon: 'message', description: 'Microsoft Teams Bot integration settings' },
      'General': { icon: 'setting', description: 'General system configuration' }
    };
    return map[name] || map['General'];
  }

  private getReportingUnitCategoryInfo(name: string): { icon: string; description: string } {
    const map: Record<string, { icon: string; description: string }> = {
      'ACM': { icon: 'security-scan', description: 'Access Conflict Monitor settings' },
      'PAM': { icon: 'key', description: 'Privilege Access Management settings' },
      'REM': { icon: 'bar-chart', description: 'Risk Execution Monitor settings' },
      'CAM': { icon: 'file-protect', description: 'Compliant Access Management settings' },
      'General': { icon: 'setting', description: 'General reporting unit settings' }
    };
    return map[name] || map['General'];
  }

  getModuleTagColor(moduleName: string): string {
    const map: Record<string, string> = { 'ACM': 'blue', 'PAM': 'green', 'REM': 'purple', 'CAM': 'gold' };
    return map[moduleName] || 'default';
  }

  getFilteredCategories(categories: SettingCategory[]): SettingCategory[] {
    if (!this.searchTerm) return categories;
    return categories
      .map(c => ({
        ...c,
        settings: c.settings.filter(s =>
          s.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          s.description?.toLowerCase().includes(this.searchTerm.toLowerCase())
        )
      }))
      .filter(c => c.settings.length > 0);
  }

  // Type detection
  getSettingType(setting: any): string {
    const n = setting.name.toLowerCase();
    const v = setting.value?.toString().toLowerCase();

    if (v === 'true' || v === 'false') return 'boolean';
    if (n.includes('enable') || n.includes('disable') || n.includes('active') ||
        n.includes('is_') || n.includes('has_') || n.includes('use_') || n.includes('show_')) return 'boolean';

    if ((n.includes('password') || n.includes('secret') || n.includes('key') || n.includes('token')) &&
        !n.includes('length') && !n.includes('count') && !n.includes('min') && !n.includes('max')) return 'password';

    if (!isNaN(Number(v)) && v !== '' &&
        (n.includes('max') || n.includes('min') || n.includes('limit') || n.includes('count') ||
         n.includes('size') || n.includes('length') || n.includes('timeout') || n.includes('interval') ||
         n.includes('days') || n.includes('hours'))) return 'number';

    return 'text';
  }

  getBooleanValue(setting: any): boolean {
    return setting.value?.toString().toLowerCase() === 'true';
  }

  toggleBoolean(setting: any): void {
    setting.value = (!this.getBooleanValue(setting)).toString();
    setting.modified = true;
  }

  markAsModified(setting: any): void {
    setting.modified = true;
  }

  saveSetting(setting: any): void {
    const { modified, showPassword, ...payload } = setting;
    const save$ = this.selectedTab === 0
      ? this.settingsService.saveGlobalSettings(payload)
      : this.settingsService.saveReportingUnitSettings(payload);

    save$.subscribe({
      next: (resp: ApiResponse) => {
        if (resp.success) {
          this.notificationService.success(resp.message || 'Setting saved');
          setting.modified = false;
          if (this.selectedTab === 0) this.loadGlobalSettings();
          else this.loadReportingUnitSettings();
        } else {
          this.notificationService.error(resp.message || 'Failed to save');
        }
      },
      error: () => this.notificationService.error('Failed to save setting')
    });
  }
}
