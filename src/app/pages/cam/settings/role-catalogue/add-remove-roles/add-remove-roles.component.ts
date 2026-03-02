import { Component, Inject, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { RoleCatalogueService } from '../role-catalogue.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-add-remove-roles',
  templateUrl: './add-remove-roles.component.html',
  styles: [`
    .exchange-container { display: flex; gap: 12px; height: 55vh; }
    .exchange-panel { flex: 1; display: flex; flex-direction: column; border: 1px solid #f0f0f0; border-radius: 4px; }
    .exchange-panel-header { padding: 8px 12px; background: #fafafa; border-bottom: 1px solid #f0f0f0; font-weight: 500; font-size: 13px; display: flex; justify-content: space-between; align-items: center; }
    .exchange-actions { display: flex; flex-direction: column; justify-content: center; gap: 8px; padding: 0 8px; }
  `],
})
export class AddRemoveRolesComponent implements OnInit {
  rcId: number;
  sapSystemId: number;
  sapSystem: string;
  roleName: string;

  // Available roles (left)
  availableData: any[] = [];
  availableTotal = 0;
  availableLoading = false;
  availablePageIndex = 1;
  availablePageSize = 10;
  availableChecked = new Set<string>();
  availableAllChecked = false;

  // Selected roles (right)
  selectedData: any[] = [];
  selectedTotal = 0;
  selectedLoading = false;
  selectedPageIndex = 1;
  selectedPageSize = 10;
  selectedChecked = new Set<string>();
  selectedAllChecked = false;

  allSelectedRoleNames: string[] = [];

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    public modal: NzModalRef,
    private rcService: RoleCatalogueService,
    private notificationService: NotificationService,
  ) {
    this.rcId = this.dialogData.rcId;
    this.sapSystemId = this.dialogData.sapSystemId;
    this.sapSystem = this.dialogData.sapSystem;
    this.roleName = this.dialogData.roleName;
    this.allSelectedRoleNames = [...(this.dialogData.allSelectedRoleNames || [])];
  }

  ngOnInit(): void {
    this.loadAvailable();
    this.loadSelected();
  }

  loadAvailable(): void {
    this.availableLoading = true;
    this.rcService.getFilteredRoleCatalogue(
      this.availablePageIndex, this.availablePageSize, '', 'ASC',
      this.rcId, this.sapSystemId, this.allSelectedRoleNames, this.sapSystem,
    ).subscribe({
      next: (res: any) => {
        this.availableData = res?.data?.rows || [];
        this.availableTotal = res?.data?.records || 0;
        this.availableLoading = false;
        this.availableChecked.clear();
        this.availableAllChecked = false;
      },
      error: () => { this.availableLoading = false; },
    });
  }

  loadSelected(): void {
    this.selectedLoading = true;
    this.rcService.getSelectedRoleCatalogue(
      this.selectedPageIndex, this.selectedPageSize, '', 'ASC',
      this.rcId, this.sapSystemId, this.allSelectedRoleNames, this.sapSystem,
    ).subscribe({
      next: (res: any) => {
        this.selectedData = res?.data?.rows || [];
        this.selectedTotal = res?.data?.records || 0;
        this.selectedLoading = false;
        this.selectedChecked.clear();
        this.selectedAllChecked = false;
      },
      error: () => { this.selectedLoading = false; },
    });
  }

  // Checkbox handlers — Available
  onAvailableItemChecked(rolename: string, checked: boolean): void {
    checked ? this.availableChecked.add(rolename) : this.availableChecked.delete(rolename);
    this.availableAllChecked = this.availableData.length > 0 && this.availableData.every(r => this.availableChecked.has(r.rolename));
  }

  onAvailableAllChecked(checked: boolean): void {
    this.availableAllChecked = checked;
    this.availableData.forEach(r => checked ? this.availableChecked.add(r.rolename) : this.availableChecked.delete(r.rolename));
  }

  // Checkbox handlers — Selected
  onSelectedItemChecked(rolename: string, checked: boolean): void {
    checked ? this.selectedChecked.add(rolename) : this.selectedChecked.delete(rolename);
    this.selectedAllChecked = this.selectedData.length > 0 && this.selectedData.every(r => this.selectedChecked.has(r.rolename));
  }

  onSelectedAllChecked(checked: boolean): void {
    this.selectedAllChecked = checked;
    this.selectedData.forEach(r => checked ? this.selectedChecked.add(r.rolename) : this.selectedChecked.delete(r.rolename));
  }

  // Move operations
  addSelected(): void {
    if (this.availableChecked.size === 0) return;
    this.availableChecked.forEach(name => {
      if (!this.allSelectedRoleNames.includes(name)) this.allSelectedRoleNames.push(name);
    });
    this.availableChecked.clear();
    this.loadAvailable();
    this.loadSelected();
  }

  removeSelected(): void {
    if (this.selectedChecked.size === 0) return;
    this.allSelectedRoleNames = this.allSelectedRoleNames.filter(n => !this.selectedChecked.has(n));
    this.selectedChecked.clear();
    this.loadAvailable();
    this.loadSelected();
  }

  removeAll(): void {
    this.allSelectedRoleNames = [];
    this.selectedChecked.clear();
    this.loadAvailable();
    this.loadSelected();
  }

  onAvailablePageChange(page: number): void {
    this.availablePageIndex = page;
    this.loadAvailable();
  }

  onSelectedPageChange(page: number): void {
    this.selectedPageIndex = page;
    this.loadSelected();
  }

  save(): void {
    this.rcService.addRolesSubmit(this.rcId, this.allSelectedRoleNames).subscribe({
      next: (res: any) => {
        this.notificationService.success(res.message || 'Roles saved');
        this.modal.close({ action: 'save' });
      },
      error: () => this.notificationService.error('Failed to save roles'),
    });
  }
}
