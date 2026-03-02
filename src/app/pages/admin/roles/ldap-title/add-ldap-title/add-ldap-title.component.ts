import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { TransferItem } from 'ng-zorro-antd/transfer';
import { RoleService } from '../../role.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { FormValidationService } from '../../../../../core/services/form-validation.service';

@Component({
  standalone: false,
  selector: 'app-add-ldap-title',
  templateUrl: './add-ldap-title.component.html',
})
export class AddLdapTitleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  form!: FormGroup;
  form$!: Observable<FormGroup>;
  transferList: TransferItem[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private notificationService: NotificationService,
    private formValidation: FormValidationService,
    public modal: NzModalRef,
  ) {}

  ngOnInit(): void {
    this.form$ = this.roleService.initNewLdapTitleForm().pipe(
      map((resp) => {
        const roles: any[] = resp.data || [];
        this.transferList = roles.map((role: any) => ({
          key: String(role.id),
          title: role.roleName,
          direction: 'left',
        } as TransferItem));

        this.form = this.fb.group({
          ldapTitle: ['', [Validators.required]],
        });
        return this.form;
      })
    );
  }

  save(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) return;

    this.loading = true;
    const data = {
      ldapTitle: this.form.get('ldapTitle')?.value,
      roles: this.transferList
        .filter((item) => item.direction === 'right')
        .map((item) => Number(item.key)),
    };

    this.roleService
      .storeLdapTitle(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.loading = false;
          this.notificationService.show(resp);
          this.modal.close(true);
        },
        error: (err) => {
          this.loading = false;
          this.formValidation.validateAllFields(this.form, err);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
