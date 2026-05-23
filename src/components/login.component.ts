
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
      <!-- Background Abstract Shapes -->
      <div class="absolute top-0 left-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2 animate-blob"></div>
      <div class="absolute top-0 right-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2 animate-blob animation-delay-2000"></div>

      <div class="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-2xl max-w-md w-full z-10 text-white transition-all duration-300">
        <div class="text-center mb-8">
          <div class="inline-block p-3 rounded-full bg-blue-600 mb-4 shadow-lg shadow-blue-500/50">
            <i class="fa-solid fa-graduation-cap text-3xl"></i>
          </div>
          <h1 class="text-3xl font-bold tracking-tight mb-2">ExamEdge Pro</h1>
          <p class="text-slate-300">Premium Exam Preparation Platform</p>
        </div>

        @if (loginMode() === 'login') {
          <div class="space-y-3 animate-fade-in">
            <h3 class="text-lg font-bold text-center">Login to your Account</h3>
            <div>
              <label class="block text-xs font-bold text-slate-400 mb-1 uppercase">Email</label>
              <input [(ngModel)]="loginEmail" type="email" class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 outline-none transition-colors" placeholder="user@example.com">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 mb-1 uppercase">Password</label>
              <input [(ngModel)]="loginPassword" type="password" class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 outline-none transition-colors" placeholder="••••••••">
            </div>
            @if (errorMsg()) {
              <div class="text-red-400 text-xs flex items-center gap-1 animate-pulse"><i class="fa-solid fa-circle-exclamation"></i> {{ errorMsg() }}</div>
            }
            <button (click)="attemptLogin()" [disabled]="isLoading()" class="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 mt-2">
              {{ isLoading() ? 'Logging in...' : 'Login' }}
            </button>
            <p class="text-center text-sm text-slate-400">
              No account? <button (click)="loginMode.set('register')" class="font-bold text-white hover:underline">Register here</button>
            </p>
          </div>
        } @else {
           <div class="space-y-3 animate-fade-in">
            <h3 class="text-lg font-bold text-center">Create a New Account</h3>
            <div>
              <label class="block text-xs font-bold text-slate-400 mb-1 uppercase">Full Name</label>
              <input [(ngModel)]="registerName" type="text" class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:border-green-500 outline-none transition-colors" placeholder="Alex Student">
            </div>
             <div>
              <label class="block text-xs font-bold text-slate-400 mb-1 uppercase">Email</label>
              <input [(ngModel)]="registerEmail" type="email" class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:border-green-500 outline-none transition-colors" placeholder="user@example.com">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 mb-1 uppercase">Password</label>
              <input [(ngModel)]="registerPassword" type="password" class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:border-green-500 outline-none transition-colors" placeholder="Min. 6 characters">
            </div>
             <div>
              <label class="block text-xs font-bold text-slate-400 mb-1 uppercase">Role</label>
              <select [(ngModel)]="registerRole" class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white focus:border-green-500 outline-none transition-colors">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            @if (errorMsg()) {
              <div class="text-red-400 text-xs flex items-center gap-1 animate-pulse"><i class="fa-solid fa-circle-exclamation"></i> {{ errorMsg() }}</div>
            }
            @if (successMsg()) {
              <div class="text-green-400 text-xs flex items-center gap-1"><i class="fa-solid fa-check-circle"></i> {{ successMsg() }}</div>
            }
            <button (click)="attemptRegister()" [disabled]="isLoading()" class="w-full bg-green-600 text-white font-bold py-2.5 rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-500/30 mt-2">
              {{ isLoading() ? 'Registering...' : 'Create Account' }}
            </button>
            <p class="text-center text-sm text-slate-400">
              Already have an account? <button (click)="loginMode.set('login')" class="font-bold text-white hover:underline">Login here</button>
            </p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
    .animate-blob { animation: blob 7s infinite; }
    .animation-delay-2000 { animation-delay: 2s; }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  
  loginMode = signal<'login' | 'register'>('login');
  isLoading = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  // Login form models
  loginEmail = signal('admin@examedge.pro');
  loginPassword = signal('dashboard_password');
  
  // Register form models
  registerName = signal('');
  registerEmail = signal('');
  registerPassword = signal('');
  registerRole = signal('student');

  private resetMessages() {
    this.errorMsg.set('');
    this.successMsg.set('');
  }

  attemptLogin() {
    this.resetMessages();
    if (!this.loginEmail() || !this.loginPassword()) {
      this.errorMsg.set('Please enter both email and password.');
      return;
    }
    this.isLoading.set(true);
    const credentials = { email: this.loginEmail(), password: this.loginPassword() };
    
    this.authService.login(credentials).subscribe({
      next: (response) => {
        // Navigation is handled by auth service
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.msg || 'Login failed. Please try again.');
        this.isLoading.set(false);
      }
    });
  }
  
  attemptRegister() {
    this.resetMessages();
    if (!this.registerName() || !this.registerEmail() || !this.registerPassword()) {
      this.errorMsg.set('Please fill out all fields.');
      return;
    }
     if (this.registerPassword().length < 6) {
      this.errorMsg.set('Password must be at least 6 characters long.');
      return;
    }
    this.isLoading.set(true);

    const userData = {
      name: this.registerName(),
      email: this.registerEmail(),
      password: this.registerPassword(),
      role: this.registerRole()
    };
    
    this.authService.register(userData).subscribe({
      next: (response) => {
        this.successMsg.set('Registration successful! Please login.');
        this.isLoading.set(false);
        this.loginMode.set('login'); // Switch to login view
      },
      error: (err) => {
        this.errorMsg.set(err.error?.msg || 'Registration failed. Please try again.');
        this.isLoading.set(false);
      }
    });
  }
}
