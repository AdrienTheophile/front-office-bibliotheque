import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'https://127.0.0.1:8008/api';

  isLoggedIn = signal(false);
  userEmail = signal('');
  userRoles = signal<string[]>([]);

  constructor() {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      this.isLoggedIn.set(true);
      this.loadUserInfo();
    }
  }

  login(email: string, password: string) {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login_check`, { email, password });
  }

  handleLoginSuccess(token: string) {
    localStorage.setItem('jwt_token', token);
    this.isLoggedIn.set(true);
    this.loadUserInfo();
  }

  logout() {
    localStorage.removeItem('jwt_token');
    this.isLoggedIn.set(false);
    this.userEmail.set('');
    this.userRoles.set([]);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  isAdmin(): boolean {
    return this.userRoles().includes('ROLE_ADMIN');
  }

  private loadUserInfo() {
    this.http.get<any>(`${this.apiUrl}/user/me`).subscribe({
      next: (user) => {
        this.userEmail.set(user.email);
        this.userRoles.set(user.roles);
      },
      error: () => {
        this.logout();
      }
    });
  }
}
