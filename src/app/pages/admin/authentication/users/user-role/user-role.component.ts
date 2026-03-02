import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { Subject, takeUntil, tap } from 'rxjs';
import { TransferItem } from 'ng-zorro-antd/transfer';
import { AuthenticationMgmtService } from '../../authentication.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-user-role',
  templateUrl: './user-role.component.html',
  styleUrls: ['./user-role.component.scss'],
})
export class UserRoleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  user: any;
  transferList: TransferItem[] = [];
  loading = false;

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    private authService: AuthenticationMgmtService,
    private notificationService: NotificationService,
    public modal: NzModalRef,
  ) {}

  ngOnInit(): void {
    this.user = this.dialogData.user;
    if (this.user) {
      this.loadRoles();
    }
  }

  private loadRoles(): void {
    this.loading = true;
    this.authService.userRoles(this.user.id)
      .pipe(
        tap(resp => {
          const allRoles = resp.data.userRoles || [];
          const assignedIds: number[] = resp.data.userVO?.roleIds || [];
          this.transferList = allRoles.map((role: any) => ({
            key: String(role.id),
            title: role.roleName,
            direction: assignedIds.includes(role.id) ? 'right' : 'left',
          } as TransferItem));
          this.loading = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  saveUserRoles(): void {
    const selectedIds = this.transferList
      .filter(item => item.direction === 'right')
      .map(item => Number(item.key));

    this.authService.saveUserRoles({
      id: this.user.id,
      username: this.user.username,
      roleIds: selectedIds,
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe(resp => {
      this.notificationService.show(resp);
      this.modal.close();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
