import { Component, inject, signal, computed, viewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { DataService, ContentItem, Announcement, Reply, Meeting, TeacherProfile } from '../services/data.service';

@Component({
  selector: 'app-teacher-dashboard',
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
             <i class="fa-solid fa-chalkboard-user text-green-500 text-xl"></i>
             <div>
               <h2 class="text-xl font-bold text-white tracking-tight">Teacher Portal</h2>
             </div>
          </div>
          <button (click)="toggleSidebar()" class="md:hidden text-slate-400 hover:text-white">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
        
        <nav class="flex-1 p-4 space-y-1">
          <button (click)="view.set('content')" [class]="view() === 'content' ? 'bg-green-600 text-white shadow-lg' : 'hover:bg-slate-800'" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors">
            <i class="fa-solid fa-file-alt w-5 text-center"></i> My Content
          </button>
          <button (click)="view.set('communication')" [class]="view() === 'communication' ? 'bg-green-600 text-white shadow-lg' : 'hover:bg-slate-800'" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors">
            <i class="fa-solid fa-comments w-5 text-center"></i> Communication
          </button>
        </nav>

        <div class="p-4 border-t border-slate-800">
           <div class="text-center text-xs text-slate-500 mb-4">
            Welcome, <span class="font-bold text-slate-300">{{ authService.currentUser()?.name }}</span>
          </div>
          <button (click)="authService.logout()" class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
            <i class="fa-solid fa-right-from-bracket"></i> Logout
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto flex flex-col w-full">
        <header class="bg-white shadow-sm sticky top-0 z-10 px-4 md:px-8 py-4 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <button (click)="toggleSidebar()" class="md:hidden text-slate-600 hover:text-slate-900">
              <i class="fa-solid fa-bars text-xl"></i>
            </button>
            <h1 class="text-xl font-bold text-slate-800 capitalize">{{ view() === 'content' ? 'My Content Dashboard' : 'Communication Hub' }}</h1>
          </div>
        </header>

        <div class="p-4 md:p-8">
         @switch (view()) {
            @case ('content') {
              <!-- Analytics Cards -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <p class="text-slate-500 text-sm font-medium">My Net Revenue</p>
                  <h3 class="text-3xl font-bold text-green-600">{{ totalRevenue() | currency }}</h3>
                </div>
                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <p class="text-slate-500 text-sm font-medium">Total Downloads</p>
                  <h3 class="text-3xl font-bold text-blue-600">{{ totalDownloads() }}</h3>
                </div>
                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <p class="text-slate-500 text-sm font-medium">Uploaded Materials</p>
                  <h3 class="text-3xl font-bold text-purple-600">{{ myContent().length }}</h3>
                </div>
              </div>

              <!-- Content Management -->
              <div class="bg-white rounded-xl shadow-sm border border-slate-200">
                <div class="p-6 border-b border-slate-200">
                    <h3 class="font-bold text-lg text-slate-800">Upload New Material</h3>
                    <p class="text-sm text-slate-500">All uploaded materials are automatically premium.</p>
                </div>
                <div class="p-6 bg-slate-50">
                    <form [formGroup]="contentForm" (ngSubmit)="uploadContent()" class="space-y-4">
                      <!-- Form fields for content upload -->
                      <input formControlName="title" placeholder="Title" class="w-full px-3 py-2 rounded-lg border border-slate-300">
                      <textarea formControlName="description" placeholder="Description" class="w-full px-3 py-2 rounded-lg border border-slate-300"></textarea>
                      <input formControlName="tags" placeholder="Tags (comma-separated)" class="w-full px-3 py-2 rounded-lg border border-slate-300">
                      <input formControlName="category" placeholder="Category" class="w-full px-3 py-2 rounded-lg border border-slate-300">
                      <input formControlName="price" type="number" placeholder="Price" class="w-full px-3 py-2 rounded-lg border border-slate-300">
                      <input #teacherFileUploader type="file" (change)="onFileSelected($event)">
                      <button type="submit" [disabled]="contentForm.invalid || !selectedFileName()" class="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50">Upload</button>
                    </form>
                </div>
                <!-- Content Table -->
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-sm text-slate-600">
                    <thead class="bg-slate-50 text-slate-700 uppercase text-xs font-bold">
                      <tr>
                        <th class="px-6 py-4">Title</th>
                        <th class="px-6 py-4">Price</th>
                        <th class="px-6 py-4">Category</th>
                        <th class="px-6 py-4">Downloads</th>
                        <th class="px-6 py-4">My Revenue</th>
                        <th class="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      @for (item of myContent(); track item.id) {
                        <tr class="hover:bg-slate-50">
                          <td class="px-6 py-4 font-medium text-slate-900">{{ item.title }}</td>
                          <td class="px-6 py-4 font-bold text-slate-800">{{ item.price ? (item.price | currency) : 'Free' }}</td>
                          <td class="px-6 py-4">{{ item.category }}</td>
                          <td class="px-6 py-4 font-bold text-blue-600">{{ item.downloads || 0 }}</td>
                          <td class="px-6 py-4 font-bold text-green-600">{{ (item.revenue || 0) | currency }}</td>
                          <td class="px-6 py-4 text-right">
                            <button (click)="dataService.deleteContent(item.id)" class="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50">
                              <i class="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      } @empty {
                        <tr><td colspan="6" class="text-center p-6 text-slate-500">You haven't uploaded any content yet.</td></tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
            @case ('communication') {
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Left Column: Announcements & Calls -->
                <div class="space-y-6">
                   <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 class="font-bold text-lg text-slate-800 mb-2">Admin Communication</h3>
                        @if(myProfile(); as profile) {
                            @if(profile.canVideoCall) {
                                <p class="text-sm text-slate-600 mb-4">Your calling permissions are enabled.</p>
                                <button (click)="startVideoCall('Admin')" class="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700">
                                    <i class="fa-solid fa-video mr-2"></i>Video Call Admin
                                </button>
                            } @else {
                                <p class="text-sm text-slate-600 mb-4">Request permission from an admin to enable video & audio calls.</p>
                                <button (click)="requestPermissions()" [disabled]="hasPendingRequest()" class="w-full bg-slate-800 text-white font-bold py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {{ hasPendingRequest() ? 'Request Pending' : 'Request Call Permissions' }}
                                </button>
                            }
                        }
                   </div>

                   <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <h3 class="font-bold text-lg text-slate-800 mb-4">Post an Announcement</h3>
                      <form [formGroup]="announcementForm" (ngSubmit)="postAnnouncement()" class="space-y-4">
                         <textarea formControlName="content" class="w-full p-2 border border-slate-300 rounded-lg" rows="3" placeholder="Type your message..."></textarea>
                         <div class="flex justify-between items-center">
                            <label class="flex items-center gap-2 text-sm text-slate-600">
                               <input formControlName="isPinned" type="checkbox" class="rounded text-green-600 focus:ring-green-500">
                               Pin this message
                            </label>
                            <button type="submit" [disabled]="announcementForm.invalid" class="bg-slate-900 text-white font-medium py-2 px-4 rounded-lg hover:bg-slate-800 disabled:opacity-50">Post</button>
                         </div>
                      </form>
                   </div>
                   <!-- My Announcements List -->
                   <div class="space-y-4">
                      @for (anno of myAnnouncements(); track anno.id) {
                        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                           <p class="text-sm text-slate-700">{{anno.content}}</p>
                           <!-- Replies -->
                           <div class="mt-4 pt-4 border-t border-slate-100 space-y-2">
                             @for (reply of anno.replies; track reply.id) {
                               <div class="text-xs p-2 rounded" [class]="reply.authorRole === 'teacher' ? 'bg-green-50' : 'bg-slate-50'">
                                  <span class="font-bold">{{reply.authorName}}: </span>{{reply.content}}
                               </div>
                             }
                             <form (ngSubmit)="postReply(anno.id, replyInput.value); replyInput.value=''" class="flex gap-2">
                                <input #replyInput placeholder="Reply..." class="flex-grow w-full bg-white border border-slate-200 rounded-full px-3 py-1 text-xs outline-none focus:border-green-500">
                                <button type="submit" class="bg-green-600 text-white rounded-full w-6 h-6 flex-shrink-0"><i class="fa-solid fa-paper-plane text-xs"></i></button>
                             </form>
                           </div>
                        </div>
                      }
                   </div>
                </div>
                <!-- Right Column: Meetings -->
                <div class="space-y-6">
                  <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                     <h3 class="font-bold text-lg text-slate-800 mb-4">Schedule a Meeting</h3>
                     <form [formGroup]="meetingForm" (ngSubmit)="scheduleMeeting()" class="space-y-4">
                        <input formControlName="topic" class="w-full p-2 border border-slate-300 rounded-lg" placeholder="Meeting Topic">
                        <input formControlName="startTime" type="datetime-local" class="w-full p-2 border border-slate-300 rounded-lg">
                        <button type="submit" [disabled]="meetingForm.invalid" class="w-full bg-slate-900 text-white font-medium py-2 px-4 rounded-lg hover:bg-slate-800 disabled:opacity-50">Schedule</button>
                     </form>
                  </div>
                  <!-- My Meetings List -->
                  <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-2">
                     @for (meeting of myMeetings(); track meeting.id) {
                       <div class="p-3 rounded-lg flex items-center justify-between" [class]="meeting.isLive ? 'bg-green-50' : 'bg-slate-50'">
                         <div>
                            <p class="font-bold">{{meeting.topic}}</p>
                            <p class="text-xs text-slate-500">{{meeting.startTime | date:'medium'}}</p>
                         </div>
                         @if (meeting.isLive) {
                          <button (click)="dataService.toggleMeetingState(meeting.id, false)" class="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">End</button>
                         } @else {
                          <button (click)="dataService.toggleMeetingState(meeting.id, true)" class="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">Start</button>
                         }
                       </div>
                     } @empty {
                        <p class="text-center text-sm text-slate-500 py-4">No meetings scheduled.</p>
                     }
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </main>

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
                       @if (callType() === 'video') {
                         <i class="fa-solid fa-user-circle text-8xl text-slate-600"></i>
                       } @else {
                          <i class="fa-solid fa-headphones text-8xl text-slate-600"></i>
                       }
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
    </div>
  `,
    styles: [`
    :host {
      display: block;
    }
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class TeacherDashboardComponent implements OnDestroy {
  authService = inject(AuthService);
  dataService = inject(DataService);
  private fb = inject(FormBuilder);
  
  isSidebarOpen = signal(false);
  view = signal<'content' | 'communication'>('content');

  teacherFileUploader = viewChild<ElementRef<HTMLInputElement>>('teacherFileUploader');

  selectedFileName = signal<string | null>(null);
  selectedFileContent = signal<string | null>(null);
  selectedFileMimeType = signal<string | null>(null);

  // Video Call State
  inCall = signal(false);
  callTarget = signal('');
  callType = signal<'video' | 'audio'>('video');
  isMuted = signal(false);
  videoEnabled = signal(true);
  localStream: MediaStream | null = null;
  localVideo = viewChild<ElementRef<HTMLVideoElement>>('localVideo');

  contentForm = this.fb.group({
    title: ['', Validators.required],
    category: ['', Validators.required],
    description: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    tags: [''],
  });

  announcementForm = this.fb.group({
    content: ['', Validators.required],
    isPinned: [false]
  });

  meetingForm = this.fb.group({
      topic: ['', Validators.required],
      startTime: ['', Validators.required]
  });

  myProfile = computed(() => {
      const userId = this.authService.currentUser()?.id;
      if (!userId) return null;
      return this.dataService.teachers().find(t => t.id === userId) ?? null;
  });

  myContent = computed(() => {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return [];
    return this.dataService.content().filter(item => item.teacherId === userId);
  });

  myAnnouncements = computed(() => {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return [];
    return this.dataService.announcements().filter(a => a.teacherId === userId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });
  
  myMeetings = computed(() => {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return [];
    return this.dataService.meetings().filter(m => m.teacherId === userId);
  });
  
  hasPendingRequest = computed(() => {
      const userId = this.authService.currentUser()?.id;
      if (!userId) return false;
      return !!this.dataService.permissionRequests().find(r => r.teacherId === userId && r.status === 'pending');
  });

  totalRevenue = computed(() => 
    this.myContent().reduce((acc, item) => acc + (item.revenue || 0), 0)
  );

  totalDownloads = computed(() => 
    this.myContent().reduce((acc, item) => acc + (item.downloads || 0), 0)
  );
  
  ngOnDestroy() {
      this.endVideoCall();
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
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
    if (this.contentForm.invalid || !this.authService.currentUser() || !this.selectedFileName()) return;
    
    const formValue = this.contentForm.value;
    const tagsArray = formValue.tags ? formValue.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    
    const newContent: ContentItem = {
      id: `c${Date.now()}`,
      title: formValue.title!,
      category: formValue.category!,
      description: formValue.description!,
      fileName: this.selectedFileName()!,
      fileContent: this.selectedFileContent() ?? undefined,
      mimeType: this.selectedFileMimeType() ?? undefined,
      type: 'note', // Default type for teacher uploads
      isLocked: true, // All teacher content is premium
      date: new Date().toISOString().split('T')[0],
      teacherId: this.authService.currentUser()!.id,
      authorName: this.authService.currentUser()!.name,
      downloads: 0,
      revenue: 0,
      price: formValue.price!,
      tags: tagsArray,
    };

    this.dataService.addContent(newContent);
    this.contentForm.reset({title: '', category: '', description: '', price: 0, tags: ''});
    this.selectedFileName.set(null);
    this.selectedFileContent.set(null);
    this.selectedFileMimeType.set(null);
    if(this.teacherFileUploader()) {
      this.teacherFileUploader()!.nativeElement.value = '';
    }
  }

  postAnnouncement() {
    if (this.announcementForm.invalid) return;
    const user = this.authService.currentUser();
    if (!user) return;
    
    const newAnnouncement: Omit<Announcement, 'id' | 'timestamp' | 'replies'> = {
        teacherId: user.id,
        teacherName: user.name,
        content: this.announcementForm.value.content!,
        isPinned: this.announcementForm.value.isPinned!
    };
    this.dataService.postAnnouncement(newAnnouncement);
    this.announcementForm.reset({ content: '', isPinned: false });
  }

  postReply(announcementId: string, content: string) {
      if (!content.trim()) return;
      const user = this.authService.currentUser();
      if (!user) return;

      const reply: Omit<Reply, 'id' | 'timestamp'> = {
        authorId: user.id,
        authorName: user.name,
        authorRole: 'teacher',
        content: content
      };
      this.dataService.postReply(announcementId, reply);
  }

  scheduleMeeting() {
      if (this.meetingForm.invalid) return;
      const user = this.authService.currentUser();
      if (!user) return;

      const newMeeting: Omit<Meeting, 'id' | 'isLive'> = {
          teacherId: user.id,
          teacherName: user.name,
          topic: this.meetingForm.value.topic!,
          startTime: new Date(this.meetingForm.value.startTime!).toISOString()
      };
      this.dataService.scheduleMeeting(newMeeting);
      this.meetingForm.reset();
  }
  
  requestPermissions() {
    const user = this.authService.currentUser();
    if (!user) return;
    this.dataService.requestCallPermission(user.id, user.name);
  }

  async startVideoCall(targetName: string, type: 'video' | 'audio' = 'video') {
    this.callTarget.set(targetName);
    this.callType.set(type);
    this.inCall.set(true);

    try {
        const constraints = { video: type === 'video', audio: true };
        this.videoEnabled.set(type === 'video');

        this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
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
}
