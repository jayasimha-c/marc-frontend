import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { UserService } from '../core/services/user.service';
import { NavigationService, NavItem } from '../core/services/navigation.service';
import { User } from '../core/models/user';

@Component({
  standalone: false,
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  isCollapsed = false;
  navigation: NavItem[] = [];
  user: User | null = null;
  currentYear = new Date().getFullYear();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private navigationService: NavigationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.navigation = this.navigationService.getFilteredNavigation();
    this.userService.user$.subscribe(user => {
      this.user = user;
      this.navigation = this.navigationService.getFilteredNavigation();
    });
  }

  signOut(): void {
    this.authService.signOut().subscribe(() => {
      this.router.navigate(['/sign-in']);
    });
  }
}
