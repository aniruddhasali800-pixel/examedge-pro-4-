import { Component, inject, computed, signal, OnInit, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { DataService, ContentItem, TeacherProfile } from '../services/data.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { GeminiService } from '../services/gemini.service';
import { select, scaleBand, scaleLinear, max, axisBottom } from 'd3';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="flex h-screen bg-slate-100 font-sans relative overflow-hidden">
      <!-- Mobile Sidebar Overlay -->
      @if (isSidebarOpen()) {
        <div (click)="toggleSidebar()" class="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm animate-fade-in"></div>
      }

      <!-- Sidebar -->
      <aside [class.translate-x-0]="isSidebarOpen()" [class.-translate-x-full]="!isSidebarOpen()" class="fixed md:static inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-30 transition-transform duration-300 ease-in-out md:translate-x-0">
        <div class="p-6 border-b border-slate-800 flex justify-between items-center">
          <div class="flex items-center gap-2">
             <i class="fa-solid fa-layer-group text-blue-500 text-xl"></i>
             <div>
               <h2 class="text-xl font-bold text-white tracking-tight leading-none">ExamEdge</h2>
               <span class="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Admin Panel</span>
             </div>
          </div>
          <button (click)="toggleSidebar()" class="md:hidden text-slate-400 hover:text-white">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
        
        <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
          <button (click)="setActive('dashboard')" 
                  [class]="activeTab() === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200">
            <i class="fa-solid fa-chart-line w-5 text-center"></i> Dashboard
          </button>

          <button (click)="setActive('requests')" 
                  [class]="activeTab() === 'requests' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200">
            <i class="fa-solid fa-user-check w-5 text-center"></i> 
            Requests
            @if (pendingRequests().length > 0) {
              <span class="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{{ pendingRequests().length }}</span>
            }
          </button>
          
          <button (click)="setActive('content')" 
                  [class]="activeTab() === 'content' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200">
            <i class="fa-solid fa-file-circle-plus w-5 text-center"></i> Content
          </button>
          
          <button (click)="setActive('teachers')" 
                  [class]="activeTab() === 'teachers' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200">
            <i class="fa-solid fa-chalkboard-user w-5 text-center"></i> Teachers
          </button>
          
          <button (click)="setActive('users')" 
                  [class]="activeTab() === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200">
            <i class="fa-solid fa-users-gear w-5 text-center"></i> Users
          </button>

          <button (click)="setActive('logs')" 
                  [class]="activeTab() === 'logs' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200">
            <i class="fa-solid fa-clock-rotate-left w-5 text-center"></i> Logs
          </button>
        </nav>

        <div class="p-4 border-t border-slate-800">
          <button (click)="authService.logout()" class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
            <i class="fa-solid fa-right-from-bracket"></i> Logout
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto flex flex-col w-full">
        <header class="bg-white shadow-sm sticky top-0 z-10 px-4 md:px-8 py-4 flex justify-between items-center flex-shrink-0">
          <div class="flex items-center gap-3">
            <button (click)="toggleSidebar()" class="md:hidden text-slate-600 hover:text-slate-900">
              <i class="fa-solid fa-bars text-xl"></i>
            </button>
            <h1 class="text-xl font-bold text-slate-800 capitalize">{{ activeTab() }}</h1>
          </div>
          <div class="flex items-center gap-4">
             <div class="hidden md:flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                System Operational
             </div>
             <img src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff" class="w-8 h-8 rounded-full border-2 border-slate-200">
          </div>
        </header>

        <div class="p-4 md:p-8">
          @switch (activeTab()) {
            @case ('dashboard') {
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div class="flex justify-between items-start mb-4">
                    <div>
                      <p class="text-slate-500 text-sm font-medium">Total Revenue</p>
                      <h3 class="text-3xl font-bold text-slate-800">{{ dataService.analytics().totalSales | currency }}</h3>
                    </div>
                    <div class="p-2 bg-green-100 text-green-600 rounded-lg"><i class="fa-solid fa-dollar-sign"></i></div>
                  </div>
                  <p class="text-xs text-green-600 flex items-center gap-1"><i class="fa-solid fa-arrow-trend-up"></i> +12.5% this month</p>
                </div>
                
                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div class="flex justify-between items-start mb-4">
                    <div>
                      <p class="text-slate-500 text-sm font-medium">Active Students</p>
                      <h3 class="text-3xl font-bold text-slate-800">{{ dataService.analytics().activeUsers }}</h3>
                    </div>
                    <div class="p-2 bg-blue-100 text-blue-600 rounded-lg"><i class="fa-solid fa-user-graduate"></i></div>
                  </div>
                  <p class="text-xs text-slate-500">Currently online: 42</p>
                </div>

                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div class="flex justify-between items-start mb-4">
                    <div>
                      <p class="text-slate-500 text-sm font-medium">Total Notes</p>
                      <h3 class="text-3xl font-bold text-slate-800">{{ dataService.content().length }}</h3>
                    </div>
                    <div class="p-2 bg-purple-100 text-purple-600 rounded-lg"><i class="fa-solid fa-file-pdf"></i></div>
                  </div>
                  <p class="text-xs text-slate-500">Last upload: 2 hours ago</p>
                </div>

                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div class="flex justify-between items-start mb-4">
                    <div>
                      <p class="text-slate-500 text-sm font-medium">Platform Revenue</p>
                      <h3 class="text-3xl font-bold text-slate-800">{{ dataService.analytics().platformRevenue | currency }}</h3>
                    </div>
                    <div class="p-2 bg-orange-100 text-orange-600 rounded-lg"><i class="fa-solid fa-hand-holding-dollar"></i></div>
                  </div>
                   <p class="text-xs text-slate-500">From teacher content sales</p>
                </div>
              </div>

              <!-- Charts Section -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h4 class="font-bold text-slate-800 mb-6">Revenue Overview</h4>
                  <div #chartContainer class="h-64 w-full"></div>
                </div>
                 <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h4 class="font-bold text-slate-800 mb-6">Recent Transactions</h4>
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left text-slate-600">
                      <thead class="bg-slate-50 text-slate-700 uppercase font-bold text-xs">
                        <tr>
                          <th class="px-4 py-3">User</th>
                          <th class="px-4 py-3">Amount</th>
                          <th class="px-4 py-3">Status</th>
                          <th class="px-4 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for(tx of dataService.transactions().slice(0, 5); track tx.id) {
                          <tr class="border-b border-slate-100">
                            <td class="px-4 py-3 font-medium">{{ tx.userEmail }}</td>
                            <td class="px-4 py-3">{{ tx.amount | currency }}</td>
                            <td class="px-4 py-3"><span [class]="getStatusClass(tx.status)">{{ tx.status }}</span></td>
                            <td class="px-4 py-3 text-xs text-slate-400">{{ tx.date }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            }

            @case ('requests') {
                 <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div class="p-6 border-b border-slate-100 bg-slate-50">
                        <h3 class="font-bold text-lg text-slate-800">Teacher Permission Requests</h3>
                        <p class="text-sm text-slate-500">Approve requests to grant teachers calling abilities.</p>
                    </div>
                     <div class="overflow-x-auto">
                       <table class="w-full text-left text-sm text-slate-600">
                         <thead class="bg-slate-50 text-slate-700 uppercase text-xs font-bold">
                           <tr>
                             <th class="px-6 py-4">Teacher Name</th>
                             <th class="px-6 py-4">Request Time</th>
                             <th class="px-6 py-4 text-right">Action</th>
                           </tr>
                         </thead>
                         <tbody class="divide-y divide-slate-100">
                           @for (req of pendingRequests(); track req.id) {
                             <tr class="hover:bg-slate-50">
                               <td class="px-6 py-4 font-medium text-slate-900">{{ req.teacherName }}</td>
                               <td class="px-6 py-4">{{ req.timestamp | date:'medium' }}</td>
                               <td class="px-6 py-4 text-right">
                                 <button (click)="dataService.approveCallPermission(req.id)" class="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full hover:bg-green-200">
                                   Approve
                                 </button>
                               </td>
                             </tr>
                           } @empty {
                                <tr>
                                    <td colspan="3" class="text-center p-8 text-slate-500">No pending requests.</td>
                                </tr>
                           }
                         </tbody>
                       </table>
                    </div>
                 </div>
            }

            @case ('content') {
              <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div>
                    <h3 class="font-bold text-lg text-slate-800">Content Management</h3>
                    <p class="text-sm text-slate-500">Upload and manage study materials</p>
                  </div>
                </div>
                
                <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                   <form [formGroup]="contentForm" (ngSubmit)="uploadContent()" class="space-y-4">
                      <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1 uppercase">Title</label>
                        <input formControlName="title" type="text" placeholder="e.g., Advanced Calculus Notes" class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all">
                      </div>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label class="block text-xs font-bold text-slate-600 mb-1 uppercase">Category</label>
                          <input formControlName="category" type="text" placeholder="e.g., Mathematics (or a new one)" list="categories-list" class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 outline-none">
                          <datalist id="categories-list">
                            @for (cat of uniqueCategories(); track cat) {
                              <option [value]="cat"></option>
                            }
                          </datalist>
                        </div>
                         <div>
                          <label class="block text-xs font-bold text-slate-600 mb-1 uppercase">Price ($)</label>
                          <input formControlName="price" type="number" placeholder="0.00 for subscription content" class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 outline-none">
                        </div>
                      </div>
                      <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1 uppercase">Description</label>
                        <textarea formControlName="description" placeholder="A brief summary of the content..." rows="3" class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 outline-none"></textarea>
                      </div>
                       <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1 uppercase">Tags</label>
                        <input formControlName="tags" type="text" placeholder="e.g., calculus, exam prep, pdf (comma-separated)" class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 outline-none">
                      </div>
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                         <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1 uppercase">Type (List)</label>
                            <select formControlName="type" class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 outline-none bg-white">
                              <option value="note">Note (PDF)</option>
                              <option value="paper">Question Paper</option>
                              <option value="topic">Important Topic</option>
                            </select>
                         </div>
                         <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1 uppercase">File Uploader</label>
                            <input #fileUploader type="file" (change)="onFileSelected($event)" class="w-full text-sm text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"/>
                         </div>
                         <button type="submit" [disabled]="contentForm.invalid || !selectedFileName()" class="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full">
                           <i class="fa-solid fa-cloud-arrow-up mr-2"></i> Upload Content
                         </button>
                      </div>
                   </form>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-left text-sm text-slate-600">
                    <thead class="bg-slate-50 text-slate-700 uppercase text-xs font-bold">
                      <tr>
                        <th class="px-6 py-4">Title</th>
                        <th class="px-6 py-4">Price</th>
                        <th class="px-6 py-4">Category</th>
                        <th class="px-6 py-4">Status</th>
                        <th class="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      @for (item of dataService.content(); track item.id) {
                        <tr class="hover:bg-slate-50 transition-colors">
                          <td class="px-6 py-4 font-medium text-slate-900">{{ item.title }}</td>
                           <td class="px-6 py-4 font-bold text-green-600">{{ item.price ? (item.price | currency) : 'Free' }}</td>
                          <td class="px-6 py-4">{{ item.category }}</td>
                          <td class="px-6 py-4">
                            <button (click)="dataService.toggleLock(item.id)" 
                                    class="text-xs font-bold px-2 py-1 rounded border transition-all"
                                    [class]="item.isLocked ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-green-100 text-green-700 border-green-200'">
                              <i [class]="item.isLocked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'"></i>
                              {{ item.isLocked ? 'PREMIUM' : 'FREE' }}
                            </button>
                          </td>
                          <td class="px-6 py-4 text-right">
                            <button (click)="dataService.deleteContent(item.id)" class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-all">
                              <i class="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
            
            @case ('teachers') {
               <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 @for(teacher of dataService.teachers(); track teacher.id) {
                   @let stats = getTeacherStats(teacher.id);
                   <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col">
                      <div class="flex-grow">
                         <div class="flex items-center gap-4 mb-4">
                           <div class="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-600">
                             {{ teacher.name.charAt(0) }}
                           </div>
                           <div>
                             <h3 class="font-bold text-slate-800">{{ teacher.name }}</h3>
                             <p class="text-xs text-slate-500">{{ teacher.email }}</p>
                           </div>
                         </div>
                         <div class="grid grid-cols-2 gap-4 text-center mb-4">
                            <div>
                               <p class="text-2xl font-bold text-blue-600">{{ stats.uploads }}</p>
                               <p class="text-xs text-slate-500 uppercase font-bold">Uploads</p>
                            </div>
                            <div>
                               <p class="text-2xl font-bold text-green-600">{{ stats.revenue | currency }}</p>
                               <p class="text-xs text-slate-500 uppercase font-bold">Revenue</p>
                            </div>
                         </div>
                         <div class="flex items-center justify-center gap-4 text-slate-400">
                            <i class="fa-solid fa-video" [class.text-green-500]="teacher.canVideoCall" title="Video Call Enabled"></i>
                            <i class="fa-solid fa-phone" [class.text-green-500]="teacher.canAudioCall" title="Audio Call Enabled"></i>
                         </div>
                      </div>
                       <button (click)="openTeacherModal(teacher)" class="w-full bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors mt-4">
                          Manage Teacher
                       </button>
                   </div>
                 }
               </div>
            }

            @case ('logs') {
              <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div>
                    <h3 class="font-bold text-lg text-slate-800">System Activity Logs</h3>
                    <p class="text-sm text-slate-500">Track user sign-ins and sign-outs</p>
                  </div>
                  <button class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                     <i class="fa-solid fa-download mr-1"></i> Export CSV
                  </button>
                </div>
                
                <div class="overflow-x-auto">
                   <table class="w-full text-left text-sm text-slate-600">
                     <thead class="bg-slate-50 text-slate-700 uppercase text-xs font-bold">
                       <tr>
                         <th class="px-6 py-4">User</th>
                         <th class="px-6 py-4">Action</th>
                         <th class="px-6 py-4">Timestamp</th>
                         <th class="px-6 py-4">IP Address</th>
                       </tr>
                     </thead>
                     <tbody class="divide-y divide-slate-100">
                       @for (log of dataService.activityLogs(); track log.id) {
                         <tr class="hover:bg-slate-50 transition-colors">
                           <td class="px-6 py-4 font-medium text-slate-900">{{ log.userEmail }}</td>
                           <td class="px-6 py-4">
                             <span [class]="getActionClass(log.action)" class="px-2 py-1 rounded-full text-xs font-bold">
                               {{ log.action }}
                             </span>
                           </td>
                           <td class="px-6 py-4">{{ log.timestamp | date:'medium' }}</td>
                           <td class="px-6 py-4 font-mono text-xs">{{ log.ip }}</td>
                         </tr>
                       }
                     </tbody>
                   </table>
                </div>
              </div>
            }

            @case ('users') {
              <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div>
                    <h3 class="font-bold text-lg text-slate-800">Registered Students</h3>
                    <p class="text-sm text-slate-500">Manage student profiles, plans, and status.</p>
                  </div>
                  <div class="flex gap-2">
                     <button class="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50">
                       <i class="fa-solid fa-filter mr-1"></i> Filter
                     </button>
                     <button class="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800">
                       <i class="fa-solid fa-plus mr-1"></i> Add User
                     </button>
                  </div>
                </div>
                
                <div class="overflow-x-auto">
                   <table class="w-full text-left text-sm text-slate-600">
                     <thead class="bg-slate-50 text-slate-700 uppercase text-xs font-bold">
                       <tr>
                         <th class="px-6 py-4">Name / Email</th>
                         <th class="px-6 py-4">Plan</th>
                         <th class="px-6 py-4">Country</th>
                         <th class="px-6 py-4">Status</th>
                         <th class="px-6 py-4">Last Login</th>
                       </tr>
                     </thead>
                     <tbody class="divide-y divide-slate-100">
                       @for (student of dataService.students(); track student.id) {
                         <tr class="hover:bg-slate-50 transition-colors">
                           <td class="px-6 py-4">
                             <div class="flex items-center gap-3">
                               <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                 {{ student.name.charAt(0) }}
                               </div>
                               <div>
                                 <div class="font-bold text-slate-900">{{ student.name }}</div>
                                 <div class="text-xs text-slate-400">{{ student.email }}</div>
                               </div>
                             </div>
                           </td>
                           <td class="px-6 py-4">
                             @if (student.plan === 'Premium') {
                               <span class="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold border border-amber-200">
                                 <i class="fa-solid fa-crown mr-1"></i> Premium
                               </span>
                             } @else {
                               <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold border border-slate-200">Free</span>
                             }
                           </td>
                           <td class="px-6 py-4">{{ student.country }}</td>
                           <td class="px-6 py-4">
                             <span [class]="student.status === 'Active' ? 'text-green-600 bg-green-50 border-green-100' : 'text-slate-400 bg-slate-50 border-slate-100'" class="px-2 py-1 rounded text-xs font-bold border">
                               {{ student.status }}
                             </span>
                           </td>
                           <td class="px-6 py-4 text-xs">{{ student.lastLogin }}</td>
                         </tr>
                       }
                     </tbody>
                   </table>
                </div>
              </div>
            }
          }
        </div>
      </main>

      <!-- Teacher Details Modal -->
      @if (selectedTeacherProfile(); as teacher) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" (click)="closeTeacherModal()">
          <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col h-[90vh] overflow-hidden animate-slide-up" (click)="$event.stopPropagation()">
            <!-- Modal Header -->
            <div class="p-4 border-b flex justify-between items-center flex-shrink-0">
               <div>
                  <h2 class="text-lg font-bold">Managing: {{ teacher.name }}</h2>
                  <p class="text-xs text-slate-500">{{ teacher.email }}</p>
               </div>
               <button (click)="closeTeacherModal()" class="text-slate-400 hover:text-slate-800"><i class="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <!-- Modal Tabs -->
            <div class="p-2 bg-slate-50 border-b flex-shrink-0">
               <nav class="flex gap-2">
                  <button (click)="modalView.set('content')" [class]="modalView() === 'content' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-200'" class="px-4 py-2 rounded-md text-sm font-medium transition-colors">Uploaded Content</button>
                  <button (click)="modalView.set('chat')" [class]="modalView() === 'chat' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-200'" class="px-4 py-2 rounded-md text-sm font-medium transition-colors">Chat</button>
                   <button (click)="modalView.set('permissions')" [class]="modalView() === 'permissions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-200'" class="px-4 py-2 rounded-md text-sm font-medium transition-colors">Permissions</button>
               </nav>
            </div>
            
            <!-- Modal Content -->
            <div class="flex-grow overflow-y-auto">
              @if (modalView() === 'content') {
                 <div class="overflow-x-auto">
                   <table class="w-full text-left text-sm text-slate-600">
                     <thead class="bg-slate-50 text-slate-700 uppercase text-xs font-bold sticky top-0">
                       <tr>
                         <th class="px-6 py-4">Title</th>
                         <th class="px-6 py-4">Price</th>
                         <th class="px-6 py-4">Downloads</th>
                         <th class="px-6 py-4">Revenue</th>
                       </tr>
                     </thead>
                     <tbody class="divide-y divide-slate-100">
                       @for (item of selectedTeacherContent(); track item.id) {
                         <tr class="hover:bg-slate-50">
                           <td class="px-6 py-4 font-medium">{{ item.title }}</td>
                           <td class="px-6 py-4 font-bold">{{ item.price | currency }}</td>
                           <td class="px-6 py-4">{{ item.downloads || 0 }}</td>
                           <td class="px-6 py-4 font-bold text-green-600">{{ item.revenue || 0 | currency }}</td>
                         </tr>
                       } @empty {
                         <tr><td colspan="4" class="text-center p-8 text-slate-500">No content uploaded by this teacher yet.</td></tr>
                       }
                     </tbody>
                   </table>
                 </div>
              } @else if (modalView() === 'chat') {
                 <div class="flex flex-col h-full">
                    <div class="flex-grow p-4 space-y-4 overflow-y-auto">
                      @for(message of selectedTeacherChat()?.messages; track message.id) {
                         <div class="flex" [class.justify-end]="message.senderId === 'admin'">
                            <div class="max-w-xs md:max-w-md p-3 rounded-xl" [class]="message.senderId === 'admin' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-800'">
                               <p class="text-sm">{{ message.text }}</p>
                               <p class="text-xs mt-1 opacity-70" [class.text-right]="message.senderId === 'admin'">{{ message.timestamp | date:'shortTime' }}</p>
                            </div>
                         </div>
                      } @empty {
                         <div class="text-center text-slate-400 pt-16">No messages yet. Start the conversation!</div>
                      }
                    </div>
                    <div class="p-4 border-t bg-slate-50 flex-shrink-0">
                       <form (ngSubmit)="sendChatMessage()" class="flex gap-2">
                          <input [(ngModel)]="chatInputMessage" name="chatInput" class="flex-grow px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 outline-none" placeholder="Type a message...">
                          <button type="submit" [disabled]="!chatInputMessage()" class="bg-slate-800 text-white font-bold px-5 py-2 rounded-lg hover:bg-slate-900 disabled:opacity-50">Send</button>
                       </form>
                       <div class="flex gap-2 mt-2">
                            <button class="flex-1 bg-blue-50 text-blue-700 text-sm font-medium p-2 rounded-lg hover:bg-blue-100 disabled:opacity-50" [disabled]="!teacher.canVideoCall">
                               <i class="fa-solid fa-video mr-1"></i> Start Video Call
                            </button>
                             <button class="flex-1 bg-slate-200 text-slate-700 text-sm font-medium p-2 rounded-lg hover:bg-slate-300 disabled:opacity-50" [disabled]="!teacher.canAudioCall">
                               <i class="fa-solid fa-phone mr-1"></i> Start Audio Call
                            </button>
                       </div>
                    </div>
                 </div>
              } @else if (modalView() === 'permissions') {
                  <div class="p-6 space-y-4">
                      <h3 class="font-bold text-slate-800">Communication Permissions</h3>
                      <div class="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200">
                         <p class="font-medium text-slate-700">Enable Video Calls</p>
                         <input type="checkbox" class="toggle toggle-success" [checked]="teacher.canVideoCall" (change)="updatePermissions(teacher, { canVideoCall: $event.target.checked, canAudioCall: teacher.canAudioCall })" />
                      </div>
                       <div class="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200">
                         <p class="font-medium text-slate-700">Enable Audio Calls</p>
                         <input type="checkbox" class="toggle toggle-success" [checked]="teacher.canAudioCall" (change)="updatePermissions(teacher, { canVideoCall: teacher.canVideoCall, canAudioCall: $event.target.checked })" />
                      </div>
                  </div>
              }
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out;
    }
     .animate-slide-up {
       animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
       from { opacity: 0; transform: translateY(20px); scale: 0.95; }
       to { opacity: 1; transform: translateY(0); scale: 1; }
    }
     /* Basic Toggle Styles */
    .toggle {
        -webkit-appearance: none;
        appearance: none;
        width: 3.5rem;
        height: 1.75rem;
        border-radius: 9999px;
        background-color: #e5e7eb;
        position: relative;
        transition: background-color 0.2s ease-in-out;
        cursor: pointer;
    }
    .toggle:checked {
        background-color: #22c55e; /* toggle-success color */
    }
    .toggle::before {
        content: "";
        position: absolute;
        top: 0.25rem;
        left: 0.25rem;
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 9999px;
        background-color: white;
        transition: transform 0.2s ease-in-out;
    }
    .toggle:checked::before {
        transform: translateX(1.75rem);
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  authService = inject(AuthService);
  dataService = inject(DataService);
  geminiService = inject(GeminiService);
  private fb: FormBuilder = inject(FormBuilder);
  
  chartContainer = viewChild<ElementRef>('chartContainer');
  fileUploader = viewChild<ElementRef<HTMLInputElement>>('fileUploader');

  activeTab = signal<'dashboard' | 'content' | 'users' | 'logs' | 'teachers' | 'requests'>('dashboard');
  isSidebarOpen = signal(false);
  isGenerating = signal(false);
  
  selectedFileName = signal<string | null>(null);
  selectedFileContent = signal<string | null>(null);
  selectedFileMimeType = signal<string | null>(null);

  // Teacher Modal State
  selectedTeacherId = signal<string | null>(null);
  modalView = signal<'content' | 'chat' | 'permissions'>('content');
  chatInputMessage = signal('');


  contentForm = this.fb.group({
    title: ['', Validators.required],
    category: ['', Validators.required],
    description: ['', Validators.required],
    type: ['note', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    tags: [''],
  });

  uniqueCategories = computed(() => {
    const categories = this.dataService.content().map(item => item.category);
    return [...new Set(categories)];
  });

  pendingRequests = computed(() => {
      return this.dataService.permissionRequests().filter(r => r.status === 'pending');
  });

  selectedTeacherProfile = computed(() => {
    const selectedId = this.selectedTeacherId();
    if (!selectedId) return null;
    return this.dataService.teachers().find(t => t.id === selectedId) ?? null;
  });

  selectedTeacherContent = computed(() => {
    const teacher = this.selectedTeacherProfile();
    if (!teacher) return [];
    return this.dataService.content().filter(c => c.teacherId === teacher.id);
  });

  selectedTeacherChat = computed(() => {
      const teacher = this.selectedTeacherProfile();
      if (!teacher) return null;
      return this.dataService.teacherChats().find(c => c.teacherId === teacher.id);
  });

  ngOnInit() {
    setInterval(() => {
        if (this.activeTab() === 'dashboard' && this.chartContainer()) {
             this.renderChart();
        }
    }, 1000); 
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  setActive(tab: 'dashboard' | 'content' | 'users' | 'logs' | 'teachers' | 'requests') {
    this.activeTab.set(tab);
    this.isSidebarOpen.set(false); // Close sidebar on mobile select
  }
  
  getTeacherStats(teacherId: string) {
      const content = this.dataService.content().filter(c => c.teacherId === teacherId);
      const revenue = content.reduce((acc, item) => acc + (item.revenue || 0), 0);
      return {
          uploads: content.length,
          revenue: revenue
      };
  }

  openTeacherModal(teacher: TeacherProfile) {
      this.selectedTeacherId.set(teacher.id);
      this.modalView.set('content');
  }

  closeTeacherModal() {
      this.selectedTeacherId.set(null);
  }

  updatePermissions(teacher: TeacherProfile, perms: { canVideoCall: boolean, canAudioCall: boolean }) {
      this.dataService.updateTeacherPermissions(teacher.id, perms);
  }

  sendChatMessage() {
      const teacher = this.selectedTeacherProfile();
      const text = this.chatInputMessage().trim();
      if (!teacher || !text) return;

      this.dataService.sendMessageToTeacher(teacher.id, text);
      this.chatInputMessage.set('');
  }

  renderChart() {
    const el = this.chartContainer()?.nativeElement;
    if (!el || el.childElementCount > 0) return; 

    const data = this.dataService.analytics().monthlyEarnings;
    const width = el.clientWidth;
    const height = el.clientHeight;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const svg = select(el)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`);

    const x = scaleBand()
      .domain(data.map((_, i) => `Month ${i + 1}`))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = scaleLinear()
      .domain([0, max(data) || 8000])
      .range([height - margin.bottom, margin.top]);

    svg.append("g")
      .attr("fill", "#3b82f6")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (_, i) => x(`Month ${i + 1}`)!)
      .attr("y", d => y(d))
      .attr("height", d => y(0) - y(d))
      .attr("width", x.bandwidth())
      .attr("rx", 4);

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(axisBottom(x).tickSize(0).tickPadding(10))
      .select(".domain").remove();
      
    svg.selectAll(".label")
        .data(data)
        .enter()
        .append("text")
        .attr("x", (_, i) => x(`Month ${i + 1}`)! + x.bandwidth() / 2)
        .attr("y", d => y(d) - 5)
        .attr("text-anchor", "middle")
        .attr("class", "text-xs fill-slate-500")
        .text(d => `$${d}`);
  }

  getBadgeClass(type: string) {
    switch (type) {
      case 'note': return 'bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold uppercase';
      case 'paper': return 'bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase';
      case 'topic': return 'bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold uppercase';
      default: return 'bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold uppercase';
    }
  }

  getActionClass(action: string) {
      switch(action) {
          case 'Sign In': return 'bg-green-100 text-green-700 border border-green-200';
          case 'Sign Out': return 'bg-slate-200 text-slate-700 border border-slate-300';
          case 'Purchase': return 'bg-amber-100 text-amber-700 border border-amber-200';
          case 'Upload': return 'bg-blue-100 text-blue-700 border border-blue-200';
          default: return 'bg-gray-100 text-gray-600';
      }
  }

  getStatusClass(status: string) {
      switch(status) {
          case 'Success': return 'bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold';
          case 'Failed': return 'bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold';
          case 'Pending': return 'bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold';
          default: return 'bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-bold';
      }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName.set(file.name);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const [, base64Content] = e.target.result.split(',');
        this.selectedFileContent.set(base64Content);
        this.selectedFileMimeType.set(file.type);
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedFileName.set(null);
      this.selectedFileContent.set(null);
      this.selectedFileMimeType.set(null);
    }
  }

  uploadContent() {
    if (this.contentForm.valid && this.selectedFileName()) {
      const val = this.contentForm.value;
      const tagsArray = val.tags ? val.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      
      this.dataService.addContent({
        id: Math.random().toString(36).substr(2, 9),
        title: val.title!,
        category: val.category!,
        description: val.description!,
        type: val.type as any,
        isLocked: true, 
        date: new Date().toISOString().split('T')[0],
        fileName: this.selectedFileName() || 'document.pdf',
        fileContent: this.selectedFileContent() ?? undefined,
        mimeType: this.selectedFileMimeType() ?? undefined,
        price: val.price!,
        tags: tagsArray,
        authorName: this.authService.currentUser()?.name || 'ExamEdge Staff'
      });
      this.contentForm.reset({ type: 'note', title: '', category: '', description: '', price: 0, tags: '' });
      this.selectedFileName.set(null);
      this.selectedFileContent.set(null);
      this.selectedFileMimeType.set(null);
      if (this.fileUploader()) {
        this.fileUploader()!.nativeElement.value = '';
      }
    }
  }

  async generateAiReply(question: string, textarea: HTMLTextAreaElement) {
    this.isGenerating.set(true);
    const reply = await this.geminiService.draftReply(question);
    textarea.value = reply;
    this.isGenerating.set(false);
  }
}