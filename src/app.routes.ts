
import { Routes } from '@angular/router';
import { LoginComponent } from './components/login.component';
import { AdminDashboardComponent } from './components/admin-dashboard.component';
import { StudentDashboardComponent } from './components/student-dashboard.component';
import { TeacherDashboardComponent } from './components/teacher-dashboard.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'admin', 
    component: AdminDashboardComponent, 
    canActivate: [authGuard], 
    data: { roles: ['admin'] } 
  },
  { 
    path: 'teacher', 
    component: TeacherDashboardComponent,
    canActivate: [authGuard],
    data: { roles: ['teacher'] } 
  },
  { 
    path: 'student', 
    component: StudentDashboardComponent,
    canActivate: [authGuard],
    data: { roles: ['student'] } 
   },
];
