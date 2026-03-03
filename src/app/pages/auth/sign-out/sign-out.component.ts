import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, takeWhile, tap, timer, finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  standalone: false,
  selector: 'app-sign-out',
  templateUrl: './sign-out.component.html',
})
export class SignOutComponent implements OnInit, OnDestroy {
  countdown = 10;
  isPaused = false;
  signedOut = false;
  loginTime = '';
  sessionDuration = '';

  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService, private router: Router) {
    this.calculateSessionInfo();
  }

  ngOnInit(): void {
    this.authService.signOut().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.clearAllData();
      this.signedOut = true;
      this.startCountdown();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get countdownPercent(): number {
    return ((10 - this.countdown) / 10) * 100;
  }

  cancelRedirect(): void {
    this.isPaused = true;
  }

  goToSignIn(): void {
    this.isPaused = true;
    this.router.navigate(['/sign-in']);
  }

  private calculateSessionInfo(): void {
    const storedLoginTime = sessionStorage.getItem('loginTime');
    if (storedLoginTime) {
      const loginDate = new Date(storedLoginTime);
      this.loginTime = loginDate.toLocaleTimeString();

      const duration = Date.now() - loginDate.getTime();
      const hours = Math.floor(duration / (1000 * 60 * 60));
      const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
      this.sessionDuration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    } else {
      this.loginTime = 'N/A';
      this.sessionDuration = '< 1m';
    }
  }

  private clearAllData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('user');
    localStorage.removeItem('license_status');
    localStorage.removeItem('reportingUnit');
    localStorage.removeItem('reportingUnitName');
    sessionStorage.clear();
    // Clear cookies
    document.cookie.split(';').forEach(c => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
  }

  private startCountdown(): void {
    timer(1000, 1000).pipe(
      takeUntil(this.destroy$),
      takeWhile(() => this.countdown > 0 && !this.isPaused),
      tap(() => this.countdown--),
      finalize(() => {
        if (!this.isPaused && this.countdown <= 0) {
          this.router.navigate(['/sign-in']);
        }
      }),
    ).subscribe();
  }
}
