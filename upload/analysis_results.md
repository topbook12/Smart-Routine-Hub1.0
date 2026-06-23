# 🔍 Smart Routine Hub — সম্পূর্ণ ওয়েবসাইট বিশ্লেষণ

> **URL:** https://smart-routine-hub-puce.vercel.app/
> **উদ্দেশ্য:** ICE Department, Rajshahi University-এর জন্য একাডেমিক ক্লাস রুটিন ম্যানেজমেন্ট সিস্টেম।

---

## 1. টেকনোলজি স্ট্যাক

| বিভাগ | টেকনোলজি |
|---|---|
| **Framework** | Next.js 16 (App Router, TypeScript) |
| **UI Library** | React 19, Radix UI (shadcn/ui components) |
| **Styling** | TailwindCSS v4, Custom CSS (globals.css — 1081 lines) |
| **Animation** | Framer Motion |
| **Database** | Firebase Firestore (real-time) + Prisma ORM |
| **Auth** | NextAuth.js v4 (Credentials + PIN provider) |
| **State Management** | Zustand (settings store) |
| **Icons** | Lucide React |
| **Font** | Geist Sans & Geist Mono (Google Fonts) |
| **Deployment** | Vercel |
| **PWA** | Service Worker, Web Push Notifications, Install prompt |
| **Other** | date-fns, Recharts, React Hook Form, Zod, Sonner (toast) |

---

## 2. পেজ স্ট্রাকচার ও রাউটিং

```
/ (Homepage) ← URL query দিয়ে ভিউ পরিবর্তন হয়
  /?view=master-calendar → Master Routine Calendar
  /?view=student → Student View
  /?view=library → Library View
/login → Teacher/Admin Login (Email + PIN)
/admin → Admin Dashboard (Protected)
/teacher → Teacher Dashboard (Protected)
```

### রাউটিং কিভাবে কাজ করে:
- মূল `page.tsx` এ `useSearchParams()` দিয়ে `view` parameter পড়ে
- `view` এর মান অনুযায়ী বিভিন্ন component render হয়:
  - `null/home` → `<HomePage />`
  - `master-calendar` → `<MasterRoutineCalendar />`
  - `student` → `<StudentView />`
  - `library` → `<LibraryView />`

---

## 3. Layout Structure (layout.tsx)

সবকিছু wrap করা হয়:
```
ThemeProvider → NextAuthProvider → SettingsProvider
  ├── MobileHeader (শুধু মোবাইলে দেখায়)
  ├── DesktopNav (শুধু ডেস্কটপে দেখায়)
  ├── <main> {children} </main>
  ├── Footer
  ├── MobileBottomNav (fixed bottom, মোবাইলে)
  └── Toaster (toast notifications)
```

**SEO Metadata:**
- Title, Description, Keywords, OpenGraph, Twitter Card, Apple Web App মেটাডাটা সব আছে
- Viewport: width=device-width, initial-scale=1, maximum-scale=1
- Theme color: light=#10b981, dark=#059669

---

## 4. প্রতিটি পেজের বিস্তারিত ফিচার

### 4.1 🏠 Homepage

#### Hero Section:
- Academic Session badge (glassmorphism effect)
- বড় gradient title: "Smart Routine Hub"
- Subtitle: "ICE-RU Department Management System"
- **Teacher/Admin Login** বাটন (gradient teal)
- **PWA Install** বাটন (যদি installable হয়)
- **Notification Enable/Disable** বাটন
- **Online/Offline Status** indicator (WiFi icon সহ)

#### Notification Section:
- Real-time notices Firebase থেকে (useRealtimeNotices hook)
- প্রতিটি notification-এ icon (type অনুযায়ী):
  - 🔴 Class Cancelled → XCircle (red)
  - 🟡 Rescheduled → CalendarClock (amber)
  - 🔵 Room Changed → MapPin (blue)
  - 🟢 General → Bell (emerald)
- Relative time display (Just now, 5m ago, 2h ago, etc.)
- Semester ও Program badge সহ
- Unread indicator (green dot)

#### Programs Section (BSc & MSc):
- **BSc** — 8 semesters, Teal color scheme
- **MSc** — 3 semesters, Amber color scheme
- প্রতিটি semester একটি interactive card:
  - Hover এ উপরে ওঠে (y: -4px, scale: 1.02)
  - Glow effect on hover
  - ক্লিক করলে → Master Calendar-এ যায় (সেই semester filter সহ)

#### Features Section ("Why Smart Routine Hub?"):
- 3টি feature card:
  1. Smart Scheduling (teal gradient)
  2. Teacher Directory (amber gradient)
  3. Resource Library (cyan gradient)
- Hover animation (y: -6px, scale: 1.01)

#### Mobile Bottom Nav (শুধু mobile):
- Fixed bottom, 4টি tab: Home, Master, Student, Alerts
- Unread count badge (red)
- Notification Drawer (Sheet component, bottom 80vh)

---

### 4.2 📅 Master Routine Calendar

#### Header:
- Title: "Master Routine"
- View toggle: Cards | List | Grid
- Back to Home বাটন
- Notification বাটন

#### Smart Filters (6টি dropdown):
| Filter | Options |
|---|---|
| Program | All / BSc / MSc |
| Semester | All / 1st-8th |
| Teacher | All / teacher list (from Firebase) |
| Room | All / room list |
| Day | All / Saturday-Friday |
| Reset | সব filter clear |

#### Summary Cards (4টি):
- Total classes, Today's classes, Teachers count, Rooms count

#### View Modes:

**Cards View:**
- প্রতিটি দিনের জন্য Card
- দিনের header-এ "Today" badge (যদি আজকের দিন হয়)
- Classes grid (1-4 columns responsive)

**List View:**
- Table-like layout
- Day badge, Time, Course code, Room, Type

**Grid View (Weekly Calendar):**
- 8-column grid (Time + 7 days)
- Week navigation (Previous/Next week, Today বাটন)
- Time slots: 08:00 - 16:00
- Schedule items gradient cards

---

### 4.3 👨‍🎓 Student View

#### Selection:
- Program dropdown (BSc/MSc)
- Semester dropdown (dynamic based on program)

#### Stats Cards (4টি, premium 3D):
- Classes count, Days count, Semester, Program

#### View Modes (3টি):
1. **Cards** — দিন অনুযায়ী group, gradient day headers, "Today" highlight
2. **List** — Compact rows, day badge + time + course
3. **Timeline** — Vertical timeline with gradient line, day markers, connecting lines

#### Schedule Change Handling:
- Cancelled classes ফিল্টার আউট
- Rescheduled classes-এ নতুন day/time/room দেখায়
- "Moved" badge সহ original schedule info

---

### 4.4 📚 Library View

#### Hero Section:
- Title: "Google Library"
- Subtitle: "Access course materials and resources"

#### Step 1 — Degree Selection:
- **B.Sc.** card (teal, 8 semesters)
- **M.Sc.** card (amber, 3 semesters)
- **Others** card (purple, Google Drive link)

#### Step 2 — Semester Selection:
- Grid layout (responsive)
- Available semesters → clickable (ExternalLink icon)
- Unavailable → disabled, opacity 50%
- ক্লিক করলে → Google Drive link (new tab)

---

### 4.5 🔐 Login Page

#### Two Login Methods:

**Email/Password Login:**
- Decorative background (animated gradient blobs)
- ICE logo (gradient teal-emerald-cyan with sparkle)
- Email field (with Mail icon)
- Password field (with Lock icon, show/hide toggle)
- Gradient submit button
- Error display (red alert box)

**PIN Login (Mobile-friendly):**
- 6-digit PIN input
- PIN dots visual indicator
- Number pad (3x4 grid, amber gradient buttons)
- Auto-submit when 6 digits entered
- Back to email login option

#### Auth Flow:
- Login → NextAuth credentials/pin sign-in
- Success → redirect based on role:
  - admin → /admin
  - teacher → /teacher
  - other → /
- Corrupted session auto-clear on mount

---

### 4.6 👨‍💼 Admin Dashboard (/admin)

> **Access:** Only `role === "admin"` users

#### Sidebar Navigation (8 sections):
1. **Dashboard** — Stats overview
2. **Teachers** — CRUD teachers
3. **Courses** — CRUD courses
4. **Rooms** — CRUD rooms
5. **Schedules** — CRUD class schedules
6. **Notices** — CRUD notices/announcements
7. **Library** — Manage Google Drive links
8. **Settings** — Site configuration

#### Dashboard Stats:
- Total Teachers, Active Courses, Total Rooms, Total Schedules, Pending Notices

#### Teachers Management:
- Add/Edit/Delete teachers
- Fields: fullName, email, designation, phone, officeRoom, bio, password

#### Courses Management:
- Fields: name, code, creditHours, type (theory/lab), semester, program (bsc/msc)

#### Rooms Management:
- Fields: roomNumber, building, type (classroom/lab/seminar), capacity

#### Schedules Management:
- Fields: courseId, teacherId, roomId, timeSlotId, startTime, endTime, dayOfWeek, semester, program
- Teacher ও Course filter

#### Notices Management:
- Fields: title, content, category, isPinned

#### Library Links Management:
- Fields: degree (bsc/msc/others), semester, url, title

#### Site Settings (Tabs):
- **General**: siteName, siteTagline, departmentName, universityName, contactEmail, contactPhone, address, aboutText
- **Header**: Navigation links (dynamic add/remove)
- **Footer**: Quick links, description, social media URLs
- **Developer**: Developer name ও URL

---

### 4.7 👨‍🏫 Teacher Dashboard (/teacher)

> **Access:** Only `role === "teacher"` users

#### Features:
- **My Schedule** — Teacher-এর নিজের class schedule দেখা
- **Cancel Class** — কারণ লিখে ক্লাস cancel
- **Reschedule Class** — নতুন day/time/room select, available rooms check
- **Add Extra Class** — নতুন ক্লাস যোগ করা
- **Create Notice** — Notice/announcement তৈরি
- **Delete Notice** — নিজের notice মুছে ফেলা
- **Notification Bar** — Fixed bottom bar, real-time notifications
- **View Modes** — Cards ও List view
- **Filters** — Semester, Program, Room, Day filter

#### Schedule Change Features:
- Class cancel → students get notification
- Reschedule → room availability check, conflict detection
- Status badges: Cancelled (red), Rescheduled (amber), Room Changed (blue)

---

## 5. Data Models (Firestore Collections)

### schedules
```typescript
{
  id, courseId, teacherId, roomId, timeSlotId,
  courseName, courseCode, teacherName, roomNumber,
  startTime, endTime, dayOfWeek,
  semester (number), program ("bsc"/"msc"),
  classType ("theory"/"lab"), isActive (boolean)
}
```

### scheduleChanges
```typescript
{
  id, scheduleId, changeType ("cancelled"/"rescheduled"/"room_changed"/"extra_class"),
  originalDay, originalStartTime, originalEndTime, originalRoomId, originalRoomNumber,
  newDay, newStartTime, newEndTime, newRoomId, newRoomNumber,
  effectiveDate, reason, courseName, courseCode,
  teacherId, teacherName, semester, program,
  changedBy, changedByName, isActive
}
```

### notices
```typescript
{
  id, title, content, category ("academic"/"exam"/"event"/"general"/"schedule_change"),
  changeType?, scheduleChangeId?, affectedSemester?, affectedProgram?,
  postedBy, postedByName, isPinned, isApproved, isAutoGenerated,
  attachmentURL?, expiryDate?, createdAt, updatedAt
}
```

### users
```typescript
{
  id, email, fullName, designation?, department,
  phone?, photoURL?, officeRoom?, bio?,
  role ("admin"/"teacher"), isActive
}
```

### courses
```typescript
{ id, name, code, creditHours, type ("theory"/"lab"), semester, program, isActive }
```

### rooms
```typescript
{ id, roomNumber, building?, type ("classroom"/"lab"/"seminar"), capacity, isActive }
```

### timeSlots
```typescript
{ id, label, startTime, endTime, slotOrder, isBreak, isActive }
```

---

## 6. API Routes (22টি endpoint)

| Route | Methods | কাজ |
|---|---|---|
| `/api/auth` | NextAuth | Authentication |
| `/api/schedules` | GET, POST, PUT, DELETE | Schedule CRUD |
| `/api/schedule-changes` | GET, POST | Cancel/Reschedule classes |
| `/api/teachers` | GET, POST, PUT, DELETE | Teacher management |
| `/api/courses` | GET, POST, PUT, DELETE | Course management |
| `/api/rooms` | GET | Room list + availability check |
| `/api/notices` | GET, POST, DELETE | Notice/announcement |
| `/api/notifications` | GET | Notification list |
| `/api/timeslots` | GET | Time slot list |
| `/api/stats` | GET | Dashboard statistics |
| `/api/settings` | GET, PUT | Site settings |
| `/api/library-links` | GET, POST, PUT, DELETE | Library link management |
| `/api/user` | GET | Current user info |
| `/api/seed` | POST | Database seeding |
| `/api/calendar` | GET | Calendar data |

---

## 7. Real-time Data System (Firebase Snapshots)

6টি custom React hook (`use-realtime-data.ts`):

| Hook | Collection | Real-time? |
|---|---|---|
| `useRealtimeSchedules(filters?)` | schedules | ✅ onSnapshot |
| `useRealtimeScheduleChanges(filters?)` | scheduleChanges | ✅ onSnapshot |
| `useRealtimeNotices(filters?)` | notices | ✅ onSnapshot |
| `useRealtimeTimeSlots()` | timeSlots | ✅ onSnapshot |
| `useRealtimeRooms(type?)` | rooms | ✅ onSnapshot |
| `useRealtimeTeachers()` | users (role=teacher) | ✅ onSnapshot |
| `useRealtimeCourses(filters?)` | courses | ✅ onSnapshot |
| `useRealtimeDashboardData(teacherId?)` | Combined | ✅ All above |

### কিভাবে কাজ করে:
1. Firestore `onSnapshot` listener সেট করে
2. Data পরিবর্তন হলে automatic re-render
3. Component unmount-এ unsubscribe
4. Memory filters (semester, program, day, teacherId)

---

## 8. PWA Features

- **Service Worker** — Offline caching
- **Install Prompt** — "Install App" বাটন
- **Push Notifications** — Subscribe/Unsubscribe
- **Online/Offline Detection** — Real-time status indicator
- **manifest.json** — App name, icons (72px-512px), theme color

---

## 9. Design System

### Color Palette:
| ব্যবহার | Light | Dark |
|---|---|---|
| Primary (Teal) | #0D9488 | #2DD4BF |
| Secondary (Amber) | #F59E0B | #FBBF24 |
| Background | #FAFBFC | #0F172A |
| Card | #FFFFFF | #1E293B |
| Text | #1E293B | #F1F5F9 |
| Muted | #F1F5F9 | #334155 |
| Border | #E2E8F0 | #334155 |

### Theory vs Lab Color Scheme:
- **Theory** → Teal/Emerald/Cyan gradients
- **Lab** → Amber/Orange/Yellow gradients

### Premium CSS Effects:
- `.card-3d` — Multi-layer shadow, hover lift
- `.card-inner-glow` — Inner gradient overlay
- `.glass` / `.glass-premium` — Glassmorphism
- `.btn-depth` / `.btn-3d` — 3D button effect
- `.stat-card-premium` — Decorative corner glow
- `.hero-bg` — Radial gradient background
- `.text-gradient-primary` — Gradient text
- `.badge-glow` — Pulsing badge animation

### Animations:
- `float-subtle` — Subtle up/down float
- `pulse-soft` — Smooth opacity pulse
- `shimmer-soft` — Shimmer highlight
- `fade-up` — Fade in from bottom
- `scale-in` — Scale in from 0.95

---

## 10. Responsive Design

| Breakpoint | Layout |
|---|---|
| **Mobile (< 640px)** | Single column, bottom nav, hamburger menu, sheet drawers |
| **Tablet (640-1024px)** | 2-column grids, side navigation starts |
| **Desktop (> 1024px)** | Full desktop nav, 3-4 column grids, all features visible |

### Mobile-specific Features:
- `MobileBottomNav` — Fixed bottom 4-tab navigation
- `MobileHeader` — Compact top header
- `NotificationDrawer` — Bottom sheet (80vh)
- Text size adjustments (text-xs on mobile, text-sm on desktop)
- Hidden labels on mobile (icon-only buttons)

---

## 11. Authentication Flow

```
Login Page → NextAuth signIn("credentials" | "pin")
  ↓
JWT Session Cookie created
  ↓
getSession() → check role
  ↓
admin → /admin
teacher → /teacher
other → /
```

### Role-based Access:
- **Public**: Homepage, Student View, Master Calendar, Library, Login
- **Teacher**: Teacher Dashboard (own schedules, cancel/reschedule, notices)
- **Admin**: Full CRUD on everything + Site Settings

---

## 12. Key Component Architecture

```
src/
├── app/
│   ├── page.tsx          (2312 lines — HomePage, StudentView, MasterCalendar, Library)
│   ├── layout.tsx        (133 lines — providers, nav, footer)
│   ├── globals.css       (1081 lines — design system)
│   ├── login/page.tsx    (429 lines — Email + PIN login)
│   ├── admin/page.tsx    (2936 lines — Full admin dashboard)
│   ├── teacher/page.tsx  (1810 lines — Teacher dashboard)
│   └── api/              (22 API route directories)
├── components/
│   ├── layout/ (desktop-nav, footer, mobile-nav)
│   ├── shared/
│   └── ui/ (shadcn components — Button, Card, Badge, Dialog, Select, Tabs, Sheet, etc.)
├── hooks/ (use-auth, use-pwa, use-push-notifications, use-realtime-data, use-toast, use-mobile)
├── lib/ (firebase config, utils)
├── providers/ (theme, session, settings)
├── store/ (zustand settings store)
└── types/
```

---

## 13. সারাংশ — একটি Similar ওয়েবসাইট বানাতে যা যা লাগবে

### Core Features চেকলিস্ট:
- [ ] Next.js App Router setup (TypeScript)
- [ ] Firebase Firestore integration (real-time listeners)
- [ ] NextAuth authentication (email/password + PIN)
- [ ] Role-based access (admin/teacher/student-public)
- [ ] Class schedule CRUD (admin)
- [ ] Schedule changes (cancel/reschedule with notifications)
- [ ] Real-time notices/announcements system
- [ ] Multiple view modes (cards/list/timeline/grid)
- [ ] Smart filters (program, semester, teacher, room, day)
- [ ] Library links management (Google Drive)
- [ ] Site settings management (admin)
- [ ] PWA support (install, push notifications, offline)
- [ ] Dark/Light theme
- [ ] Mobile-first responsive design
- [ ] Premium UI (gradients, glassmorphism, 3D cards, animations)
- [ ] Mobile bottom navigation
- [ ] Online/offline status indicator
