import { Component, inject, signal, computed, viewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { DataService, ContentItem, Announcement, Reply } from '../services/data.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      <!-- Navbar -->
      <nav class="bg-white border-b border-slate-200 sticky top-0 z-40 flex-shrink-0">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <i class="fa-solid fa-graduation-cap"></i>
              </div>
              <span class="font-bold text-xl text-slate-900 tracking-tight">ExamEdge</span>
            </div>
            
            <div class="flex items-center gap-4">
              @if (authService.currentUser()?.plan === 'premium') {
                <div class="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-xs font-bold">
                  <i class="fa-solid fa-crown"></i> Premium Plan
                </div>
              } @else {
                 <button (click)="openPayment()" class="hidden md:flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white rounded-full text-xs font-bold shadow-md transition-all transform hover:scale-105">
                  <i class="fa-solid fa-bolt"></i> Upgrade to Pro
                </button>
              }
              <div class="flex items-center gap-3 pl-4 md:border-l border-slate-200">
                <span class="hidden md:block text-sm font-medium text-slate-700">{{ authService.currentUser()?.name }}</span>
                <button (click)="authService.logout()" class="text-slate-400 hover:text-red-500 transition-colors">
                  <i class="fa-solid fa-right-from-bracket"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content Scroll Area -->
      <main class="flex-grow overflow-y-auto pb-24 md:pb-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          
          <!-- Mobile Tabs -->
          <div class="md:hidden flex mb-6 bg-white rounded-xl shadow-sm border border-slate-100 p-1">
            <button (click)="mobileTab.set('study')" [class]="mobileTab() === 'study' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'" class="flex-1 py-2 rounded-lg text-sm font-medium transition-all">
              Study
            </button>
            <button (click)="mobileTab.set('scores')" [class]="mobileTab() === 'scores' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'" class="flex-1 py-2 rounded-lg text-sm font-medium transition-all">
              Scores
            </button>
            <button (click)="mobileTab.set('comms')" [class]="mobileTab() === 'comms' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'" class="flex-1 py-2 rounded-lg text-sm font-medium transition-all">
              Comms
            </button>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- Left: Content Feed -->
            <div class="lg:col-span-2 space-y-6" [class.hidden]="mobileTab() !== 'study' && mobileTab() !== 'desktop'">
              
              <!-- Filters -->
              <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button (click)="filter.set('all')" [class]="filter() === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'" class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0">
                  All Materials
                </button>
                <button (click)="filter.set('note')" [class]="filter() === 'note' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'" class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0">
                  <i class="fa-solid fa-book mr-1"></i> Notes
                </button>
                <button (click)="filter.set('paper')" [class]="filter() === 'paper' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'" class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0">
                  <i class="fa-solid fa-file-pen mr-1"></i> Papers
                </button>
                <button (click)="filter.set('topic')" [class]="filter() === 'topic' ? 'bg-orange-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'" class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0">
                  <i class="fa-solid fa-star mr-1"></i> Important
                </button>
              </div>

              <!-- Items List -->
              <div class="space-y-4">
                @for (item of filteredContent(); track item.id) {
                  <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative overflow-hidden">
                    @if (item.isLocked && authService.currentUser()?.plan !== 'premium' && (!item.price || item.price > 0)) {
                      <div class="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-4">
                        <i class="fa-solid fa-lock text-3xl text-slate-400 mb-2"></i>
                        <h3 class="font-bold text-slate-700">Premium Content</h3>
                        <p class="text-sm text-slate-500 mb-3">Upgrade or purchase to view this material.</p>
                         @if(item.price && item.price > 0) {
                           <button (click)="purchaseAndDownload(item)" class="bg-green-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-green-700 shadow-lg shadow-green-500/30">
                            Buy Now ({{item.price | currency}})
                           </button>
                         } @else {
                           <button (click)="openPayment()" class="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30">Unlock with Pro</button>
                         }
                      </div>
                    }

                    <div class="flex justify-between items-start mb-2">
                      <div class="flex items-center gap-2">
                        <span [class]="getBadgeClass(item.type)">{{ item.type }}</span>
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ item.category }}</span>
                      </div>
                      <span class="text-xs text-slate-400">By {{item.authorName || 'ExamEdge'}}</span>
                    </div>
                    
                    <h3 class="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{{ item.title }}</h3>
                    <p class="text-slate-600 text-sm mb-4 leading-relaxed protected-content line-clamp-2">{{ item.description }}</p>
                    
                     @if(item.tags && item.tags.length > 0) {
                        <div class="flex flex-wrap gap-1 mb-4">
                            @for(tag of item.tags; track tag) {
                                <span class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">{{tag}}</span>
                            }
                        </div>
                     }

                    <div class="flex items-center gap-4 pt-4 border-t border-slate-50 flex-wrap">
                      <button (click)="viewingItem.set(item)" class="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                        <i class="fa-regular fa-eye"></i> View Details
                      </button>
                       @if (item.price && item.price > 0) {
                        <button (click)="purchaseAndDownload(item)" class="flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-800 transition-colors">
                           <i class="fa-solid fa-cart-shopping"></i> Buy ({{item.price | currency}})
                        </button>
                       } @else {
                        <button (click)="downloadFile(item)" class="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                          <i class="fa-solid fa-download"></i> {{ item.isLocked ? 'Download (Premium)' : 'Download' }}
                        </button>
                       }
                      <div class="ml-auto">
                        <i class="fa-solid fa-shield-cat text-slate-200" title="Protected Content"></i>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Scores View (Mobile Tab & Desktop Sidebar) -->
            <div class="lg:col-span-1 space-y-6" [class.hidden]="mobileTab() !== 'scores' && mobileTab() !== 'desktop'">
               <!-- Scores List -->
               <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div class="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 class="font-bold text-slate-800 flex items-center gap-2">
                      <i class="fa-solid fa-trophy text-amber-500"></i> My Performance
                    </h3>
                  </div>
                  
                  <div class="max-h-[500px] overflow-y-auto p-2 space-y-2">
                    @for (result of dataService.results(); track result.id) {
                      <div class="bg-white p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between">
                         <div class="flex-1 min-w-0 mr-4">
                            <p class="text-sm font-bold text-slate-700 truncate">{{ result.examTitle }}</p>
                            <p class="text-xs text-slate-500">{{ result.subject }} • {{ result.date }}</p>
                         </div>
                         <div class="text-right">
                            <div class="text-lg font-bold" [class]="getScoreColor(result.score, result.total)">
                              {{ result.score }}/{{ result.total }}
                            </div>
                            <div class="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Score</div>
                         </div>
                      </div>
                    }
                  </div>
               </div>
            </div>

            <!-- Right: Communication Hub -->
            <aside class="space-y-6 lg:block" [class.hidden]="mobileTab() !== 'comms' && mobileTab() !== 'desktop'">
                <div class="bg-white rounded-xl shadow-sm border border-slate-100 sticky top-24">
                  <div class="p-4 border-b border-slate-100">
                    <h3 class="font-bold text-slate-800">Communication Hub</h3>
                  </div>
                  <div class="p-4 space-y-6 max-h-[80vh] overflow-y-auto">
                    <!-- Meetings -->
                    <div>
                      <h4 class="font-bold text-xs uppercase text-slate-400 mb-2">Class Meetings</h4>
                      <div class="space-y-2">
                        @for (meeting of dataService.meetings(); track meeting.id) {
                          <div class="p-3 rounded-lg flex items-center justify-between" [class]="meeting.isLive ? 'bg-green-50 border border-green-200' : 'bg-slate-50 border border-slate-100'">
                             <div>
                                <p class="text-sm font-bold text-slate-800">{{meeting.topic}}</p>
                                <p class="text-xs text-slate-500">w/ {{meeting.teacherName}} • {{meeting.startTime | date:'short'}}</p>
                             </div>
                             @if (meeting.isLive) {
                              <button (click)="startVideoCall(meeting.teacherName)" class="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
                                <i class="fa-solid fa-video"></i> Join
                              </button>
                             }
                          </div>
                        }
                      </div>
                    </div>

                    <!-- Announcements -->
                    <div>
                      <h4 class="font-bold text-xs uppercase text-slate-400 mb-2">Announcements</h4>
                       <div class="space-y-4">
                         @for (anno of sortedAnnouncements(); track anno.id) {
                           <div class="bg-slate-50 border border-slate-100 rounded-lg p-3">
                              <div class="flex items-start gap-2">
                                 <div class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 mt-1 flex-shrink-0">
                                   {{ anno.teacherName.charAt(0) }}
                                 </div>
                                 <div class="flex-grow">
                                    <div class="flex justify-between items-start">
                                      <p class="text-xs text-slate-500">
                                        <span class="font-bold text-slate-800">{{ anno.teacherName }}</span> posted
                                      </p>
                                      @if (anno.isPinned) {
                                        <i class="fa-solid fa-thumbtack text-slate-400 text-xs" title="Pinned"></i>
                                      }
                                    </div>
                                    <p class="text-sm text-slate-700 py-2">{{anno.content}}</p>
                                    
                                    <!-- Replies -->
                                    <div class="space-y-2 mt-2">
                                       @for (reply of anno.replies; track reply.id) {
                                         <div class="flex items-start gap-2">
                                            <div class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" [class]="reply.authorRole === 'teacher' ? 'bg-slate-300 text-slate-600' : 'bg-blue-200 text-blue-700'">
                                              {{ reply.authorName.charAt(0) }}
                                            </div>
                                            <div class="bg-white border border-slate-100 rounded p-2 text-xs w-full">
                                               <div class="flex justify-between items-center">
                                                  <p class="font-bold">{{ reply.authorName }}</p>
                                                  @if (reply.authorRole === 'teacher') {
                                                    <button (click)="startVideoCall(reply.authorName)" class="text-blue-500 hover:text-blue-700"><i class="fa-solid fa-video"></i></button>
                                                  }
                                               </div>
                                               <p>{{ reply.content }}</p>
                                            </div>
                                         </div>
                                       }
                                    </div>

                                    <!-- Reply Form -->
                                    <div class="mt-2">
                                      <form (ngSubmit)="postReply(anno.id, replyInput.value); replyInput.value = ''" class="flex items-center gap-2">
                                         <input #replyInput type="text" placeholder="Reply..." class="w-full bg-white border border-slate-200 rounded-full px-3 py-1 text-xs outline-none focus:border-blue-500">
                                         <button type="submit" class="bg-slate-800 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0"><i class="fa-solid fa-paper-plane text-xs"></i></button>
                                      </form>
                                    </div>
                                 </div>
                              </div>
                           </div>
                         }
                       </div>
                    </div>
                  </div>
                </div>
            </aside>

          </div>
        </div>
      </main>

      <!-- Details Modal -->
      @if (viewingItem(); as item) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" (click)="viewingItem.set(null)">
          <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-slide-up" (click)="$event.stopPropagation()">
            <div class="p-6 border-b">
              <h2 class="text-2xl font-bold">{{ item.title }}</h2>
              <p class="text-sm text-slate-500">by {{ item.authorName || 'ExamEdge' }} in <span class="font-bold">{{ item.category }}</span></p>
            </div>
            <div class="p-6 max-h-[60vh] overflow-y-auto">
               <p class="text-slate-700 leading-relaxed whitespace-pre-wrap">{{ item.description }}</p>
            </div>
            <div class="p-4 bg-slate-50 flex justify-between items-center">
              <div>
                @if(item.tags && item.tags.length > 0) {
                  <div class="flex flex-wrap gap-1">
                      @for(tag of item.tags; track tag) {
                          <span class="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-1 rounded-full">{{tag}}</span>
                      }
                  </div>
                }
              </div>
              <button (click)="viewingItem.set(null)" class="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300">Close</button>
            </div>
          </div>
        </div>
      }

      <!-- Video Call Modal -->
       @if (inCall()) {
         <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-lg animate-fade-in">
            <div class="bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full aspect-video overflow-hidden animate-slide-up flex flex-col relative text-white">
                <div class="absolute top-4 left-4 text-xs bg-black/30 px-2 py-1 rounded-full">
                  <p>In call with: <span class="font-bold">{{ callTarget() }}</span></p>
                </div>
                <div class="flex-grow grid grid-cols-2 gap-2 p-2 h-full">
                    <div class="bg-black rounded-lg relative overflow-hidden">
                       <video #localVideo autoplay playsinline class="w-full h-full object-cover"></video>
                       <p class="absolute bottom-2 left-2 text-xs bg-black/30 px-2 py-1 rounded-full">You</p>
                    </div>
                    <div class="bg-black rounded-lg flex items-center justify-center">
                       <i class="fa-solid fa-user-circle text-8xl text-slate-600"></i>
                       <p class="absolute bottom-2 left-2 text-xs bg-black/30 px-2 py-1 rounded-full">{{ callTarget() }}</p>
                    </div>
                </div>
                <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent flex justify-center items-center gap-4">
                    <button class="w-12 h-12 rounded-full flex items-center justify-center" [class]="isMuted() ? 'bg-white text-slate-800' : 'bg-white/20 hover:bg-white/30'">
                       <i class="fa-solid fa-microphone-slash"></i>
                    </button>
                    <button class="w-12 h-12 rounded-full flex items-center justify-center" [class]="!videoEnabled() ? 'bg-white text-slate-800' : 'bg-white/20 hover:bg-white/30'">
                       <i class="fa-solid fa-video-slash"></i>
                    </button>
                     <button (click)="endVideoCall()" class="w-16 h-12 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-lg">
                       <i class="fa-solid fa-phone-slash"></i>
                    </button>
                </div>
            </div>
         </div>
       }

      <!-- Payment Modal -->
      @if (showPaymentModal()) {
        <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up">
              <div class="bg-slate-900 p-6 text-white text-center relative overflow-hidden">
                 <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
                 <h2 class="text-2xl font-bold relative z-10">Upgrade to Pro</h2>
                 <p class="text-slate-300 text-sm relative z-10">Unlock all premium content instantly</p>
                 <button (click)="showPaymentModal.set(false)" class="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                   <i class="fa-solid fa-xmark text-xl"></i>
                 </button>
              </div>
              
              <div class="p-6 space-y-4">
                 <div class="flex justify-between items-center bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <div>
                      <p class="font-bold text-amber-900">Annual Plan</p>
                      <p class="text-xs text-amber-700">$9.99 / month</p>
                    </div>
                    <i class="fa-solid fa-check-circle text-amber-600 text-xl"></i>
                 </div>

                 <div class="space-y-3">
                    <div>
                      <label class="block text-xs font-bold text-slate-600 mb-1">CARD NUMBER</label>
                      <div class="relative">
                         <i class="fa-regular fa-credit-card absolute left-3 top-3 text-slate-400"></i>
                         <input type="text" [(ngModel)]="cardNum" class="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" placeholder="0000 0000 0000 0000">
                      </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                       <div>
                          <label class="block text-xs font-bold text-slate-600 mb-1">EXPIRY</label>
                          <input type="text" [(ngModel)]="cardExp" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" placeholder="MM/YY">
                       </div>
                       <div>
                          <label class="block text-xs font-bold text-slate-600 mb-1">CVC</label>
                          <input type="text" [(ngModel)]="cardCvc" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" placeholder="123">
                       </div>
                    </div>
                 </div>

                 <button (click)="processPayment()" [disabled]="isProcessing() || !cardNum || !cardExp || !cardCvc" class="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2 disabled:opacity-50">
                    @if (isProcessing()) {
                       <i class="fa-solid fa-circle-notch fa-spin"></i> Processing...
                    } @else {
                       Pay $119.88
                    }
                 </button>
                 
                 <p class="text-center text-[10px] text-slate-400">
                   By clicking pay, you agree to our Terms of Service. Secure Payment via Stripe Integration.
                 </p>
              </div>
           </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .protected-content {
       -webkit-user-select: none;
       -moz-user-select: none;
       -ms-user-select: none;
       user-select: none;
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
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
  `]
})
export class StudentDashboardComponent implements OnDestroy {
  authService = inject(AuthService);
  dataService = inject(DataService);
  
  filter = signal<'all' | 'note' | 'paper' | 'topic'>('all');
  mobileTab = signal<'study' | 'scores' | 'comms' | 'desktop'>('study');
  
  showPaymentModal = signal(false);
  isProcessing = signal(false);
  viewingItem = signal<ContentItem | null>(null);

  // Video Call State
  inCall = signal(false);
  callTarget = signal('');
  isMuted = signal(false);
  videoEnabled = signal(true);
  localStream: MediaStream | null = null;
  localVideo = viewChild<ElementRef<HTMLVideoElement>>('localVideo');


  // Fake form model
  cardNum = '';
  cardExp = '';
  cardCvc = '';

  constructor() {
    if (typeof window !== 'undefined') {
       window.addEventListener('resize', () => {
         if (window.innerWidth >= 1024) {
           this.mobileTab.set('desktop');
         } else if (this.mobileTab() === 'desktop') {
           this.mobileTab.set('study');
         }
       });
       if (window.innerWidth >= 1024) this.mobileTab.set('desktop');
    }
  }

  ngOnDestroy() {
      this.endVideoCall();
  }

  filteredContent = computed(() => {
    const f = this.filter();
    const all = this.dataService.content();
    if (f === 'all') return all;
    return all.filter(item => item.type === f);
  });
  
  sortedAnnouncements = computed(() => {
      return this.dataService.announcements().slice().sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  });

  getBadgeClass(type: string) {
    switch (type) {
      case 'note': return 'text-purple-600 bg-purple-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-purple-100';
      case 'paper': return 'text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-blue-100';
      case 'topic': return 'text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-orange-100';
      default: return 'text-gray-600 bg-gray-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-gray-100';
    }
  }

  getScoreColor(score: number, total: number) {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-amber-600';
    return 'text-red-600';
  }

  postReply(announcementId: string, content: string) {
    if (!content.trim()) return;
    const user = this.authService.currentUser();
    if (!user) return;

    const reply: Omit<Reply, 'id' | 'timestamp'> = {
      authorId: user.id,
      authorName: user.name,
      authorEmail: user.email,
      authorRole: 'student',
      content: content
    };
    this.dataService.postReply(announcementId, reply);
  }

  async startVideoCall(targetName: string) {
    this.callTarget.set(targetName);
    this.inCall.set(true);

    try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const videoElement = this.localVideo()?.nativeElement;
        if(videoElement) {
            videoElement.srcObject = this.localStream;
        }
    } catch (err) {
        console.error("Error accessing media devices.", err);
        alert("Could not access camera or microphone. Please check permissions.");
        this.inCall.set(false);
    }
  }

  endVideoCall() {
      this.inCall.set(false);
      if (this.localStream) {
          this.localStream.getTracks().forEach(track => track.stop());
      }
      this.localStream = null;
  }

  openPayment() {
    this.showPaymentModal.set(true);
  }
  
  purchaseAndDownload(item: ContentItem) {
    const user = this.authService.currentUser();
    if (!user) {
        alert("Please log in to make a purchase.");
        return;
    }
    // In a real app, this would involve a payment gateway.
    alert(`Purchasing "${item.title}" for ${item.price}. Your download will start now.`);
    this.dataService.recordItemPurchase(user.email, item);
    this.triggerDownload(item);
  }

  processPayment() {
    this.isProcessing.set(true);
    setTimeout(() => {
      // Record transaction
      const user = this.authService.currentUser();
      if (user) {
          this.dataService.recordTransaction(user.email, 119.88, 'Annual Premium');
      }

      this.authService.upgradeToPremium();
      this.isProcessing.set(false);
      this.showPaymentModal.set(false);
      alert('Payment Successful! Welcome to Pro.');
    }, 1500);
  }

  downloadFile(item: ContentItem) {
     if (item.isLocked && this.authService.currentUser()?.plan !== 'premium' && (!item.price || item.price > 0)) {
       this.openPayment();
       return;
     }
     this.triggerDownload(item);
  }

  private triggerDownload(item: ContentItem) {
       if (item.fileContent && item.mimeType) {
        try {
            const byteCharacters = atob(item.fileContent);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: item.mimeType });
            const url = window.URL.createObjectURL(blob);

            const element = document.createElement('a');
            element.href = url;
            element.download = item.fileName || 'download';
            document.body.appendChild(element);
            element.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(element);
        } catch(e) {
            console.error("Error decoding base64 string or creating blob:", e);
            alert("Could not download file. It may be corrupted.");
        }
     } else {
         // Fallback for mock data without real content
         const element = document.createElement('a');
         const fileContent = `
           ${item.title}
           Category: ${item.category}
           Date: ${item.date}
           
           ----------------------------------------
           ${item.description}
           
           ----------------------------------------
           This is a placeholder for the file: ${item.fileName || 'document.pdf'}
           
           Thank you for using ExamEdge Pro!
         `;
         
         element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(fileContent));
         element.setAttribute('download', item.fileName || (item.title + '.txt'));
         element.style.display = 'none';
         document.body.appendChild(element);
         element.click();
         document.body.removeChild(element);
     }
  }
}