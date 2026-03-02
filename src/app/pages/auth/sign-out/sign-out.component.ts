import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  standalone: false,
  selector: 'app-sign-out',
  template: `
    <div class="auth-container">
      <nz-card class="auth-card">
        <nz-result nzStatus="info" nzTitle="Signing Out..." nzSubTitle="Please wait while we sign you out.">
          <div nz-result-extra>
            <nz-spin nzSimple></nz-spin>
          </div>
        </nz-result>
      </nz-card>
    </div>
  `,
})
export class SignOutComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.signOut().subscribe(() => {
      this.router.navigate(['/sign-in']);
    });
  }
}
