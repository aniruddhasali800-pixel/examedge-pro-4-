
import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DataService } from './data.service';
import { Observable, tap, of } from 'rxjs';

export type UserRole = 'admin' | 'student' | 'teacher' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan?: 'free' | 'premium'; // This can remain a client-side concept for now
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private dataService = inject(DataService);
  
  private apiUrl = 'http://localhost:3000/api/auth';
  private USER_KEY = 'examedge_user_session';
  private TOKEN_KEY = 'examedge_auth_token';
  
  currentUser = signal<User | null>(null);

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem(this.USER_KEY);
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (user && token) {
        this.currentUser.set(JSON.parse(user));
      }
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          this.handleAuthentication(response.user, response.token);
        }
      })
    );
  }

  // This is a dummy login for students, as registration is the main flow.
  // In a real app, you'd have a full student login/register flow.
  loginStudent(plan: 'free' | 'premium' = 'premium') {
    const dummyStudent = {
      id: plan === 'premium' ? 'student-premium-id' : 'student-free-id',
      name: plan === 'premium' ? 'Alex Student' : 'Guest Student',
      email: plan === 'premium' ? 'alex@university.edu' : 'guest@student.com',
      role: 'student' as UserRole,
      plan: plan
    };
    // We can't log a student into the backend without a password.
    // So we'll navigate them and let the guard handle it.
    // This part of the UI can be adapted to use the real register/login flow.
    alert('Student registration/login should be done via the main form.');
    this.router.navigate(['/login']);
  }


  logout() {
    const user = this.currentUser();
    if (user) {
      this.dataService.logActivity(user.email, 'Sign Out');
    }
    this.currentUser.set(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
    }
    this.router.navigate(['/login']);
  }

  private handleAuthentication(user: User, token: string) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        localStorage.setItem(this.TOKEN_KEY, token);
    }
    this.currentUser.set(user);
    this.dataService.logActivity(user.email, 'Sign In');

    // Redirect based on role
    switch (user.role) {
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      case 'teacher':
        this.router.navigate(['/teacher']);
        break;
      case 'student':
        this.router.navigate(['/student']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }

  // Dummy method from old service, can be removed or adapted.
  upgradeToPremium() {
    console.log("Upgrade to premium");
  }
}
