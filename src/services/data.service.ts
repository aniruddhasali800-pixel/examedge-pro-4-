import { Injectable, signal, effect } from '@angular/core';

export interface ContentItem {
  id: string;
  title: string;
  type: 'note' | 'paper' | 'topic';
  category: string;
  isLocked: boolean;
  date: string;
  description: string;
  fileName?: string;
  fileContent?: string; // Base64 content of the file
  mimeType?: string;    // MIME type of the file (e.g., 'application/pdf')
  teacherId?: string; // ID of the teacher who uploaded it
  downloads?: number;
  revenue?: number;
  price?: number; // Price for per-item purchase
  tags?: string[]; // Content tags for categorization
  authorName?: string; // Name of the uploader
}

export interface Reply {
  id: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  authorRole: 'student' | 'teacher';
  content: string;
  timestamp: string;
}

export interface Announcement {
  id: string;
  teacherId: string;
  teacherName: string;
  content: string;
  isPinned: boolean;
  timestamp: string;
  replies: Reply[];
}

export interface Meeting {
    id: string;
    teacherId: string;
    teacherName: string;
    topic: string;
    startTime: string;
    isLive: boolean;
}

export interface Analytics {
  totalUsers: number;
  activeUsers: number;
  totalSales: number;
  platformRevenue: number;
  monthlyEarnings: number[];
}

export interface ExamResult {
  id: string;
  examTitle: string;
  score: number;
  total: number;
  date: string;
  subject: string;
}

export interface ActivityLog {
  id: string;
  userEmail: string;
  action: 'Sign In' | 'Sign Out' | 'Purchase' | 'Upload';
  timestamp: string;
  ip: string;
}

export interface Transaction {
  id: string;
  userEmail: string;
  amount: number;
  status: 'Success' | 'Failed' | 'Pending';
  date: string;
  plan: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Inactive';
  plan: 'Free' | 'Premium';
  joinDate: string;
  lastLogin: string;
  country: string;
}

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  canVideoCall: boolean;
  canAudioCall: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string; // e.g., 'admin' or teacher's id
  text: string;
  timestamp: string;
}

export interface TeacherChat {
  teacherId: string;
  messages: ChatMessage[];
}

export interface PermissionRequest {
    id: string;
    teacherId: string;
    teacherName: string;
    status: 'pending' | 'approved';
    timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private STORAGE_KEY = 'examedge_data_v8'; // Incremented version for new structure

  // Real-world Content Data
  content = signal<ContentItem[]>([
    { id: 'c1', title: 'Advanced Calculus: Limits & Continuity', type: 'note', category: 'Mathematics', isLocked: false, date: '2024-03-15', description: 'Comprehensive notes covering epsilon-delta definitions, continuity on intervals, and intermediate value theorem applications.', fileName: 'calc_limits_v2.pdf', authorName: 'ExamEdge Staff', tags: ['calculus', 'advanced', 'notes'] },
    { id: 'c2', title: 'JEE Main 2024 - Physics Full Solution', type: 'paper', category: 'Physics', isLocked: true, date: '2024-03-10', description: 'Complete step-by-step solutions for the April session. Includes free body diagrams and formula derivations.', fileName: 'jee_phys_2024.pdf', downloads: 120, revenue: 238.80, price: 1.99, authorName: 'ExamEdge Staff', tags: ['jee', 'physics', 'solved paper'] },
    { id: 'c3', title: 'Organic Chemistry: Named Reactions', type: 'topic', category: 'Chemistry', isLocked: true, date: '2024-03-08', description: 'A quick revision guide for 50+ essential named reactions including Cannizzaro, Aldol, and Wurtz reactions.', fileName: 'org_chem_cheat.pdf', teacherId: 'teacher-teacher@examedge.pro', downloads: 250, revenue: 373.75, price: 2.99, authorName: 'Dr. Evelyn Reed', tags: ['chemistry', 'organic', 'reactions'] },
    { id: 'c4', title: 'Modern History: World War II Timeline', type: 'note', category: 'History', isLocked: false, date: '2024-02-28', description: 'Detailed timeline of events from 1939 to 1945, focusing on key battles and political shifts.', fileName: 'ww2_timeline.pdf', authorName: 'ExamEdge Staff', tags: ['history', 'ww2'] },
    { id: 'c5', title: 'Biology: Cell Division (Mitosis & Meiosis)', type: 'note', category: 'Biology', isLocked: false, date: '2024-02-25', description: 'Visual notes explaining the phases of cell division with high-quality diagrams.', fileName: 'bio_cell_div.pdf', authorName: 'ExamEdge Staff', tags: ['biology', 'cell division'] },
    { id: 'c6', title: 'Computer Science: Data Structures - Trees', type: 'topic', category: 'Computer Science', isLocked: true, date: '2024-02-20', description: 'Binary Trees, AVL Trees, and Red-Black Trees explained with code snippets in C++ and Python.', fileName: 'cs_trees.pdf', teacherId: 'teacher-teacher@examedge.pro', downloads: 180, revenue: 269.1, price: 2.99, authorName: 'Dr. Evelyn Reed', tags: ['cs', 'data structures', 'algorithms'] },
    { id: 'c7', title: 'English Literature: Shakespearean Sonnets', type: 'note', category: 'English', isLocked: true, date: '2024-02-15', description: 'In-depth critical analysis of Sonnet 18 and 130, focusing on themes and literary devices.', fileName: 'shakes_sonnets.pdf', downloads: 95, revenue: 94.05, price: 0.99, authorName: 'ExamEdge Staff', tags: ['literature', 'shakespeare', 'poetry'] },
    { id: 'c8', title: 'NEET 2023 - Biology Question Paper', type: 'paper', category: 'Biology', isLocked: true, date: '2024-02-10', description: 'Original question paper from last year for practice.', fileName: 'neet_bio_23.pdf', price: 0, authorName: 'ExamEdge Staff', tags: ['neet', 'biology', 'solved paper'] },
    { id: 'c9', title: 'Macroeconomics: GDP & National Income', type: 'note', category: 'Economics', isLocked: true, date: '2024-02-05', description: 'Concepts of GDP, GNP, NNP, and methods of calculating national income.', fileName: 'macro_gdp.pdf', price: 1.49, downloads: 50, revenue: 74.5, authorName: 'ExamEdge Staff', tags: ['economics', 'gdp'] },
    { id: 'c10', title: 'Physics: Thermodynamics Laws', type: 'topic', category: 'Physics', isLocked: false, date: '2024-01-30', description: 'Zero, First, Second, and Third laws of thermodynamics explained with real-life examples.', fileName: 'phys_thermo.pdf', authorName: 'ExamEdge Staff', tags: ['physics', 'thermodynamics'] },
    { id: 'c11', title: 'Linear Algebra: Vector Spaces', type: 'note', category: 'Mathematics', isLocked: true, date: '2024-03-20', description: 'Notes on vector spaces, subspaces, linear independence, basis, and dimension.', fileName: 'linear_algebra.pdf', teacherId: 'teacher-john.doe@examedge.pro', downloads: 50, revenue: 49.5, price: 1.99, authorName: 'John Doe', tags: ['math', 'linear algebra'] },
    { id: 'c12', title: 'Creative Writing Prompts', type: 'topic', category: 'English', isLocked: true, date: '2024-03-18', description: '101 creative writing prompts to spark imagination.', fileName: 'writing_prompts.pdf', teacherId: 'teacher-susan.lee@examedge.pro', downloads: 15, revenue: 7.42, price: 0.99, authorName: 'Susan Lee', tags: ['english', 'writing'] }
  ]);

  // Communication Data
  announcements = signal<Announcement[]>([
    {
      id: 'anno1',
      teacherId: 'teacher-teacher@examedge.pro',
      teacherName: 'Dr. Evelyn Reed',
      content: 'Welcome everyone! I\'ve just uploaded new notes on Organic Chemistry. Please review them before our live session on Friday.',
      isPinned: true,
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      replies: [
        { id: 'rep1', authorId: 'student-01', authorName: 'Alex Student', authorEmail: 'alex@university.edu', authorRole: 'student', content: 'Thank you, Dr. Reed! Looking forward to it.', timestamp: new Date(Date.now() - 3600000 * 22).toISOString() },
        { id: 'rep2', authorId: 'teacher-teacher@examedge.pro', authorName: 'Dr. Evelyn Reed', authorRole: 'teacher', content: 'You\'re welcome, Alex. Let me know if you have any questions beforehand.', timestamp: new Date(Date.now() - 3600000 * 21).toISOString() },
      ]
    },
    {
      id: 'anno2',
      teacherId: 'teacher-john.doe@examedge.pro',
      teacherName: 'John Doe',
      content: 'Heads up, Math students: I\'ve added a practice paper on Linear Algebra. It\'s challenging but great practice for the finals.',
      isPinned: false,
      timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
      replies: []
    }
  ]);

  meetings = signal<Meeting[]>([
      { id: 'meet1', teacherId: 'teacher-teacher@examedge.pro', teacherName: 'Dr. Evelyn Reed', topic: 'Organic Chemistry Q&A', startTime: new Date(Date.now() + 3600000 * 48).toISOString(), isLive: false },
      { id: 'meet2', teacherId: 'teacher-john.doe@examedge.pro', teacherName: 'John Doe', topic: 'Vector Spaces Workshop', startTime: new Date(Date.now() - 3600000 * 1).toISOString(), isLive: true }
  ]);

  // Real-world Results (For Student Dashboard Mock)
  results = signal<ExamResult[]>([
    { id: 'r1', examTitle: 'Full Mock Test: Physics', score: 88, total: 100, date: '2024-03-12', subject: 'Physics' },
    { id: 'r2', examTitle: 'Math: Calculus Quiz 3', score: 45, total: 50, date: '2024-03-05', subject: 'Mathematics' },
    { id: 'r3', examTitle: 'Chemistry: Organic I', score: 62, total: 75, date: '2024-02-28', subject: 'Chemistry' }
  ]);

  // Real-world Analytics
  analytics = signal<Analytics>({
    totalUsers: 2453,
    activeUsers: 892,
    totalSales: 84350,
    platformRevenue: 642.85, // Initial platform revenue from teacher sales
    monthlyEarnings: [4200, 5100, 4800, 6200, 5900, 7800] // Last 6 months trend
  });

  // Real-world Activity Logs
  activityLogs = signal<ActivityLog[]>([
    { id: 'l1', userEmail: 'alex@university.edu', action: 'Sign In', timestamp: new Date().toISOString(), ip: '192.168.1.105' },
    { id: 'l2', userEmail: 'teacher@examedge.pro', action: 'Sign In', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), ip: '10.0.0.2' }
  ]);

  // Real-world Transactions
  transactions = signal<Transaction[]>([
    { id: 'tx_101', userEmail: 'sarah.j@gmail.com', amount: 119.88, status: 'Success', date: '2024-03-15', plan: 'Annual Premium' },
    { id: 'tx_102', userEmail: 'mike.rossi@outlook.com', amount: 9.99, status: 'Failed', date: '2024-03-14', plan: 'Monthly Premium' }
  ]);

  // Real-world Students (User Data)
  students = signal<StudentProfile[]>([
    { id: 'u1', name: 'Alex Student', email: 'alex@university.edu', status: 'Active', plan: 'Premium', joinDate: '2023-09-01', lastLogin: '2 mins ago', country: 'USA' },
    { id: 'u2', name: 'Sarah Jenkins', email: 'sarah.j@gmail.com', status: 'Active', plan: 'Premium', joinDate: '2023-10-15', lastLogin: '5 mins ago', country: 'UK' }
  ]);
  
  // Teacher Data
  teachers = signal<TeacherProfile[]>([
    { id: 'teacher-teacher@examedge.pro', name: 'Dr. Evelyn Reed', email: 'teacher@examedge.pro', joinDate: '2023-08-15', canVideoCall: true, canAudioCall: true },
    { id: 'teacher-john.doe@examedge.pro', name: 'John Doe', email: 'john.doe@examedge.pro', joinDate: '2024-01-10', canVideoCall: false, canAudioCall: false },
    { id: 'teacher-susan.lee@examedge.pro', name: 'Susan Lee', email: 'susan.lee@examedge.pro', joinDate: '2024-02-01', canVideoCall: false, canAudioCall: false }
  ]);
  
  teacherChats = signal<TeacherChat[]>([
     {
       teacherId: 'teacher-teacher@examedge.pro',
       messages: [
         { id: 'm1', senderId: 'admin', text: 'Hi Evelyn, your latest chemistry notes are getting great reviews!', timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
         { id: 'm2', senderId: 'teacher-teacher@examedge.pro', text: 'That\'s great to hear! I\'m working on a new set for thermodynamics.', timestamp: new Date(Date.now() - 3600000 * 4).toISOString() }
       ]
     }
  ]);
  
  permissionRequests = signal<PermissionRequest[]>([]);

  constructor() {
    this.loadFromStorage();
  }

  // Persistence Logic
  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) this.content.set(parsed.content);
          if (parsed.teachers) this.teachers.set(parsed.teachers);
          if (parsed.teacherChats) this.teacherChats.set(parsed.teacherChats);
          if (parsed.announcements) this.announcements.set(parsed.announcements);
          if (parsed.meetings) this.meetings.set(parsed.meetings);
          if (parsed.permissionRequests) this.permissionRequests.set(parsed.permissionRequests);
        } catch (e) {
          console.error('Failed to load local storage data', e);
        }
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      const payload = {
        content: this.content(),
        teachers: this.teachers(),
        teacherChats: this.teacherChats(),
        announcements: this.announcements(),
        meetings: this.meetings(),
        permissionRequests: this.permissionRequests(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    }
  }

  // Methods
  addContent(item: ContentItem) {
    this.content.update(items => [item, ...items]);
    this.logActivity(item.teacherId ? 'teacher' : 'admin', 'Upload');
    this.saveToStorage();
  }
  
  private recordDownload(itemId: string) {
    this.content.update(items => items.map(i => {
      if (i.id === itemId) {
        let revenueToAdd = 0;
        const itemPrice = i.price || 0;
        
        if(itemPrice > 0) {
            if (i.teacherId) {
                // Teacher content: 50% to teacher, 50% to platform
                const teacherShare = itemPrice / 2;
                const adminShare = itemPrice / 2;
                revenueToAdd = teacherShare;
                this.analytics.update(a => ({ ...a, platformRevenue: a.platformRevenue + adminShare }));
            } else {
                // Admin content: 100% to platform
                this.analytics.update(a => ({ ...a, platformRevenue: a.platformRevenue + itemPrice }));
            }
        }
        
        return {
          ...i,
          downloads: (i.downloads || 0) + 1,
          revenue: (i.revenue || 0) + revenueToAdd
        };
      }
      return i;
    }));
    this.saveToStorage();
  }

  recordItemPurchase(userEmail: string, item: ContentItem) {
      const amount = item.price || 0;
      if (amount <= 0) return;

      this.recordTransaction(userEmail, amount, `Item: ${item.title.substring(0, 20)}...`);
      this.recordDownload(item.id);
  }
  
  deleteContent(id: string) {
    this.content.update(items => items.filter(i => i.id !== id));
    this.saveToStorage();
  }

  toggleLock(id: string) {
    this.content.update(items => items.map(i => i.id === id ? { ...i, isLocked: !i.isLocked } : i));
    this.saveToStorage();
  }

  logActivity(email: string, action: 'Sign In' | 'Sign Out' | 'Purchase' | 'Upload') {
    const log: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      userEmail: email,
      action: action,
      timestamp: new Date().toISOString(),
      ip: '127.0.0.1' // Mock IP
    };
    this.activityLogs.update(logs => [log, ...logs]);
    this.saveToStorage();
  }

  recordTransaction(email: string, amount: number, plan: string) {
    const tx: Transaction = {
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      userEmail: email,
      amount: amount,
      status: 'Success',
      date: new Date().toISOString().split('T')[0],
      plan: plan
    };
    this.transactions.update(txs => [tx, ...txs]);
    this.analytics.update(a => ({
      ...a,
      totalSales: a.totalSales + amount
    }));
    this.logActivity(email, 'Purchase');
    
    if (plan.toLowerCase().includes('premium')) {
      this.students.update(students => students.map(s => s.email === email ? { ...s, plan: 'Premium' } : s));
    }
    
    this.saveToStorage();
  }

  sendMessageToTeacher(teacherId: string, text: string) {
    this.teacherChats.update(chats => {
        const chatIndex = chats.findIndex(c => c.teacherId === teacherId);
        const newMessage: ChatMessage = {
            id: `m${Date.now()}`,
            senderId: 'admin', // sent by admin
            text: text,
            timestamp: new Date().toISOString()
        };

        if (chatIndex > -1) {
            const updatedChats = [...chats];
            updatedChats[chatIndex].messages.push(newMessage);
            return updatedChats;
        } else {
            const newChat: TeacherChat = {
                teacherId: teacherId,
                messages: [newMessage]
            };
            return [...chats, newChat];
        }
    });
    this.saveToStorage();
  }

  // Communication Methods
  postAnnouncement(announcement: Omit<Announcement, 'id' | 'timestamp' | 'replies'>) {
    const newAnnouncement: Announcement = {
      ...announcement,
      id: `anno${Date.now()}`,
      timestamp: new Date().toISOString(),
      replies: []
    };
    this.announcements.update(annos => [newAnnouncement, ...annos]);
    this.saveToStorage();
  }

  postReply(announcementId: string, reply: Omit<Reply, 'id' | 'timestamp'>) {
    this.announcements.update(annos => {
      return annos.map(anno => {
        if (anno.id === announcementId) {
          const newReply: Reply = {
            ...reply,
            id: `rep${Date.now()}`,
            timestamp: new Date().toISOString()
          };
          return { ...anno, replies: [...anno.replies, newReply] };
        }
        return anno;
      });
    });
    this.saveToStorage();
  }

  scheduleMeeting(meeting: Omit<Meeting, 'id' | 'isLive'>) {
    const newMeeting: Meeting = {
      ...meeting,
      id: `meet${Date.now()}`,
      isLive: false
    };
    this.meetings.update(meetings => [newMeeting, ...meetings]);
    this.saveToStorage();
  }

  toggleMeetingState(meetingId: string, state: boolean) {
      this.meetings.update(meetings => meetings.map(m => m.id === meetingId ? {...m, isLive: state} : m));
      this.saveToStorage();
  }
  
  // Permission Methods
  requestCallPermission(teacherId: string, teacherName: string) {
    const existingRequest = this.permissionRequests().find(r => r.teacherId === teacherId && r.status === 'pending');
    if (existingRequest) return; // Prevent duplicate requests

    const newRequest: PermissionRequest = {
      id: `req${Date.now()}`,
      teacherId,
      teacherName,
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    this.permissionRequests.update(reqs => [...reqs, newRequest]);
    this.saveToStorage();
  }

  approveCallPermission(requestId: string) {
    const request = this.permissionRequests().find(r => r.id === requestId);
    if (!request) return;

    // Approve request
    this.permissionRequests.update(reqs => reqs.map(r => r.id === requestId ? { ...r, status: 'approved' } : r));
    
    // Update teacher permissions
    this.teachers.update(teachers => teachers.map(t => t.id === request.teacherId ? { ...t, canVideoCall: true, canAudioCall: true } : t));
    
    this.saveToStorage();
  }
  
  updateTeacherPermissions(teacherId: string, perms: { canVideoCall: boolean, canAudioCall: boolean }) {
    this.teachers.update(teachers => teachers.map(t => t.id === teacherId ? { ...t, ...perms } : t));
    this.saveToStorage();
  }
}