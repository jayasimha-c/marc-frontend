import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { User } from '../models/user';

@Injectable({ providedIn: 'root' })
export class UserService {
  private _user = new ReplaySubject<User>(1);
  private _currentUser: User | null = null;

  constructor() {
    this._user.subscribe(user => {
      this._currentUser = user;
    });
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        this._currentUser = user;
        this._user.next(user);
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
    }
  }

  get user$(): Observable<User> {
    return this._user.asObservable();
  }

  get user(): User | null {
    return this._currentUser;
  }

  set user(value: User) {
    this._currentUser = value;
    this._user.next(value);
    localStorage.setItem('user', JSON.stringify(value));
  }

  setUserWithParams(data: any): void {
    const user: User = {
      email: data.email,
      id: data.id,
      name: data.username,
      username: data.username,
      roles: data.roles || [],
      authorities: data.authorities || data.roles || [],
    };
    this.user = user;
  }

  hasAnyAuthority(authorities: string[]): boolean {
    if (!this._currentUser || !this._currentUser.authorities) {
      return false;
    }
    return authorities.some(auth => this._currentUser!.authorities.includes(auth));
  }
}
