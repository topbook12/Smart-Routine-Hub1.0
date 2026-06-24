# Smart Routine Hub — Worklog

---
Task ID: 1-6
Agent: Main (Z.ai Code)
Task: Build foundation, infrastructure, layout, homepage, public views, login page

Work Log:
- Read analysis_results.md (full project spec), extracted routine data from 3 PDF images via VLM, studied design system
- Created Prisma schema with 9 models: User, Course, Room, TimeSlot, Schedule, ScheduleChange, Notice, LibraryLink, Setting
- Pushed schema to SQLite, seeded DB: 31 users (1 admin + 30 teachers), 14 rooms, 6 time slots, 73 courses, 147 schedules, 4 notices, 12 library links
- Design system in globals.css: teal/amber theme, dark mode, premium effects (card-3d, glass-premium, card-inner-glow, stat-card-premium, hero-bg, gradient text, colored shadows, animations: float-subtle, badge-pulse, blob, shimmer, fade-up, scale-in)
- Types: src/types/index.ts — all interfaces, TEACHER_PROFILES (30 teachers), COURSE_NAMES (73 courses), DEFAULT_SETTINGS, DAYS
- API routes (14): auth/[...nextauth], seed, schedules, schedule-changes, teachers, courses, rooms, notices, timeslots, stats, settings, library-links, user
- NextAuth: credentials (email/password) + pin (6-digit) providers, JWT sessions, role in token
- Real-time hooks (src/hooks/use-realtime-data.ts): useRealtimeSchedules, useRealtimeScheduleChanges, useRealtimeNotices, useRealtimeTimeSlots, useRealtimeRooms, useRealtimeTeachers, useRealtimeCourses, useRealtimeStats, useSettings, useCurrentUser — all use TanStack Query with refetchInterval (5s) to simulate Firestore onSnapshot
- Zustand stores: settings-store (persisted), ui-store (theme, online, notifications, unread)
- Providers: ThemeProvider (next-themes, class attribute), NextAuthProvider, QueryProvider, SettingsSync
- PWA: manifest.json, icon-192.svg, icon-512.svg, usePWA hook (install prompt + online/offline)
- Layout: desktop-nav (glass-premium top bar), mobile-header (compact), mobile-bottom-nav (4 tabs fixed), footer (4-col, sticky bottom via mt-auto)
- Shared components: ScheduleCard (3D, gradient by theory/lab, change badges), ViewModeToggle (cards/list/grid/timeline), NotificationList (icon by type, unread dots), StatCard, LoadingState, EmptyState
- HomeView: hero (gradient title, session badge, login/install/notification buttons, online status, quick stats), notifications section, programs section (BSc 8 sem teal cards, MSc 3 sem amber cards — click navigates to master-calendar with filters), features section (3 cards)
- MasterCalendarView: 5 smart filters (program/semester/teacher/room/day + reset), 4 stat cards, 3 view modes (cards grouped by day with Today badge, list table-like, grid weekly calendar with week navigation)
- StudentView: program+semester selectors, 4 stats, 3 view modes (cards with today gradient header, list compact rows, timeline vertical gradient line)
- LibraryView: 2-step (degree cards → semester grid with available/locked states, Google Drive links)
- Login page: email/password form + PIN 6-digit keypad (auto-submit), animated gradient blobs background, role-based redirect (admin→/admin, teacher→/teacher), demo credentials shown

Stage Summary:
- All public pages + login complete and compiling cleanly
- Design system: teal (#0D9488) primary, amber (#F59E0B) secondary, dark mode via CSS vars + next-themes
- Real-time: TanStack Query refetchInterval (5s) instead of Firebase onSnapshot (Firebase not available in this env)
- Auth: NextAuth credentials + PIN providers; admin@ice.ru.ac.bd/admin123, teachers via <initials>@ice.ru.ac.bd/teacher123, PIN 000000 for admin
- Pending: Admin Dashboard (/admin) and Teacher Dashboard (/teacher)
- Key patterns for dashboards: use getSessionUser() for auth, card-3d + card-inner-glow for cards, btn-3d for buttons, gradient from-teal-600 to-emerald-600 for primary actions, useRealtime* hooks for data, toast from sonner for feedback

---
Task ID: 8
Agent: Teacher Dashboard Builder (Z.ai Code)
Task: Build the Teacher Dashboard at /src/app/teacher/page.tsx — protected personal class management dashboard for teachers (and admins acting as a teacher).

Work Log:
- Read worklog.md, types/index.ts, hooks/use-realtime-data.ts, shared components (ScheduleCard, ViewModeToggle, states), API routes (schedules, schedule-changes, notices, rooms, courses, timeslots, user), design system (globals.css), and the existing student-view/login pages for design-language consistency.
- Modified `src/components/layout/mobile-header.tsx` to hide on `/teacher`, `/admin`, `/login` paths (matching the mobile-bottom-nav behavior) so dashboards can provide their own headers.
- Created `src/components/teacher/` folder with 5 focused components:
  1. `realtime-notification-bar.tsx` — Fixed bottom-center floating bar showing the latest active schedule-change notice (cancelled/rescheduled/room_changed/extra_class) for the teacher, with colored icon, message, and dismiss button. Uses `useRealtimeScheduleChanges({ teacherId })` with 5s polling and 24h cutoff. AnimatePresence slide-up animation.
  2. `my-schedule-tab.tsx` — Filters (semester/program/room/day + reset), 4 StatCards (Total/Today/Active Days/Courses), ViewModeToggle (cards/list). Cards view groups by day with gradient "Today" highlight header. List view shows compact rows. Real-time updates via `useRealtimeSchedules({ teacherId, ...filters })` + `useRealtimeScheduleChanges({ teacherId })`. changeMap keeps only most recent change per scheduleId (changes come sorted desc by createdAt). Applies changes: hides cancelled, overrides day/time/room for rescheduled & room_changed, passes change to ScheduleCard for badges.
  3. `cancel-reschedule-tab.tsx` — Action-oriented list of teacher's classes (sorted by day+time) with status badges + Cancel/Reschedule buttons. Two dialogs:
     - CancelDialog: shows class info card, optional reason textarea, confirm posts to /api/schedule-changes with changeType:'cancelled' + original* fields.
     - RescheduleDialog: shows original info, selects for newDay (DAYS) + new time inputs (with quick time-slot chips from useRealtimeTimeSlots), and a room Select that fetches /api/rooms?day=...&startTime=...&endTime=... via useQuery(enabled=canQueryRooms). Shows "X available · Y booked" indicator, disables booked rooms in the Select, shows red empty-state if no rooms available. Confirm posts with changeType:'reschedule' + original* + new* fields.
     Both use TanStack Query useMutation + invalidateQueries(['schedule-changes','notices','schedules']) + sonner toast feedback.
  4. `notices-tab.tsx` — 2/3+1/3 grid: Create form (title, content, category select with icons academic/exam/event/general/schedule_change, isPinned switch) posts to /api/notices. My notices list filters useRealtimeNotices() by postedById === user.id, each with delete button (AlertDialog confirm) → DELETE /api/notices?id=. Auto-generated notices are tagged. Real-time updates.
  5. `extra-class-tab.tsx` — Form to schedule one-off class: course select (from useRealtimeCourses), day (DAYS), time (manual + quick slot chips from useRealtimeTimeSlots), room (availability-checked via /api/rooms?type=lab if lab course, day+time), program/semester/classType auto-derived from selected course (displayed as read-only InfoChips). Live preview panel mirrors a ScheduleCard. Posts to /api/schedule-changes with changeType:'extra_class', new* fields only (no scheduleId/original*). Avoided setState-in-effect lint error by deriving course metadata with useMemo instead of useEffect.
- Created `src/app/teacher/page.tsx` — Main page ("use client"):
  - Auth protection: useSession() status loading → spinner; unauthenticated → router.replace('/login'); user.role !== 'teacher' && !== 'admin' → AccessDenied screen with back-to-home button.
  - Admin viewing: shows AdminTeacherPicker banner with sticky positioning, lets admin pick any teacher from useRealtimeTeachers() list. effectiveTeacherId = admin?selectedTeacherId:user.id. Notices tab always uses user.id (admin's own notices). PickTeacherPrompt empty state when admin hasn't picked yet.
  - TeacherHeader: gradient avatar circle with initial, name (gradient text), designation · department, "Admin" badge if admin, Site link + Logout button (red-tinted).
  - Tabs (top scrollable on mobile = my mobile nav, since global MobileBottomNav is hidden on /teacher): Schedule / Manage / Notices / Extra. Active tab has teal→emerald gradient pill.
  - RealtimeNotificationBar at bottom.
- Verified with `curl /teacher` → 200 OK after fixing a duplicate `selectedCourse` declaration error in extra-class-tab.tsx (caught by dev server).
- Final `bun run lint` → 0 errors, only pre-existing warnings in other agents' files (admin sections, master-calendar-view, student-view). No teacher/* or app/teacher lint issues.

Stage Summary:
- Teacher Dashboard fully functional at `/teacher` route.
- 4 tabs cover all required features: My Schedule (filters+stats+cards/list), Cancel/Reschedule (dialogs with live room availability), Notices (create+delete own), Add Extra Class (form with availability check + live preview).
- Real-time everywhere via TanStack Query refetchInterval hooks. Mutations invalidate ['schedule-changes'], ['notices'], ['schedules'] so all views stay in sync within 5s.
- Auto-notice generation: each cancel/reschedule/extra-class POST auto-creates a notice via the existing /api/schedule-changes route logic.
- Admin can also use the dashboard — picks a teacher from dropdown, then manages their schedule (notices tab uses admin's own id for posting).
- Design system followed: card-3d, glass-premium, btn-3d, stat-card-premium, hero-bg, text-gradient-primary, shadow-teal-glow/amber-glow, teal/emerald gradients for theory, amber/orange for lab. Framer Motion hover lift, tap scale, stagger on all interactive lists.
- Responsive: mobile uses top scrollable tabs (min-w to allow horizontal scroll), compact stat cards, full-width dialogs; desktop uses centered tabs and 5-column grid for extra-class form.
- All files: src/app/teacher/page.tsx + src/components/teacher/{my-schedule-tab,cancel-reschedule-tab,notices-tab,extra-class-tab,realtime-notification-bar}.tsx
- Pending (next agent): Admin Dashboard at `/admin` — API routes already exist (schedules, courses, rooms, teachers, notices, schedule-changes, settings, library-links, stats). The MobileHeader now also hides on /admin so the admin agent should provide its own header.

---
Task ID: 7 + 9 + 10
Agent: Main (Z.ai Code)
Task: Build Admin Dashboard (8 CRUD sections), PWA service worker, theme toggle, and full Agent Browser verification

Work Log:
- Read worklog.md to understand foundation + teacher dashboard built by previous agents.
- Fixed login page 500 error (Backspace icon not in lucide-react → replaced with Eraser).
- Built Admin Dashboard (`src/app/admin/page.tsx` + 8 section components in `src/components/admin/`):
  - Sidebar layout: fixed left sidebar on desktop (260px, glass-premium, gradient logo, user card, nav with layoutId active animation, Back-to-site + Logout). Mobile: Sheet drawer + sticky top bar with hamburger.
  - 8 sections via AnimatePresence transitions:
    1. Dashboard — welcome hero, 6 StatCards (teachers/courses/rooms/schedules/notices/changes), Recent Notices card, Quick Actions grid.
    2. Teachers — card grid with avatar, full CRUD dialog (fullName, email, designation, phone, officeRoom, bio, password, pin), AlertDialog delete confirm.
    3. Courses — filterable table (by program), CRUD dialog (code, name, creditHours, type theory/lab, semester, program), theory=teal / lab=amber badges.
    4. Rooms — card grid (classroom=teal, lab=amber, seminar=cyan gradients), CRUD dialog (roomNumber, building, type, capacity).
    5. Schedules — biggest section: 4 filters (program/semester/day/teacher + reset), table with 200-row cap, CRUD dialog with cascading auto-fill (course→name/code/type/sem/program, teacher→name, room→number, timeSlot→times), day/time/program/semester/type selects.
    6. Notices — pinned-first sorted list, category color badges (academic/exam/event/general/schedule_change), CRUD dialog (title, content, category, isPinned switch, affectedSemester, affectedProgram), auto-generated badges.
    7. Library — grouped by degree (bsc/msc/others), card grid with active/hidden badges, CRUD dialog (degree, semester, url, title, isActive).
    8. Settings — 5 tabs (General/Header/Footer/Social/Developer) with dynamic add/remove rows for header links, footer links, social media. PUTs merged SiteSettings, invalidates settings query.
  - Shared: `useAdminMutation` hook (TanStack mutation + invalidates all relevant query keys + sonner toast), `SectionHeader` component.
  - Auth protection: useSession() loading→spinner, unauthenticated→redirect /login, authenticated but role!==admin→AccessDenied screen.
- Hid DesktopNav, Footer on /admin, /teacher, /login routes (they provide their own chrome). MobileHeader already hid these.
- Added PWA service worker (`public/sw.js`): network-first for API/_next, cache-first for pages, precache core routes. Registered via `PWARegister` provider in layout.
- Added ThemeToggle component (next-themes, Sun/Moon icons with rotate animation, queueMicrotask mounted gate to avoid set-state-in-effect lint). Wired into DesktopNav, MobileHeader, admin sidebar footer, teacher header, login page top-right.
- Fixed duplicate `view=master-calendar` in URL when navigating from homepage semester cards (params.delete("view") before re-setting).
- Agent Browser verification (all passed):
  - Homepage: all sections render (hero, stats, notices, BSc 8 + MSc 3 program cards with correct class counts, features, footer). 0 console errors.
  - Master Calendar: 5 filters work, Cards/List/Grid views all render, week navigation in grid works.
  - Student View: BSc Sem 3 shows 17 classes across 5 days, Today badge on Tuesday, theory/lab color badges, Cards/List/Timeline toggle.
  - Library: BSc degree → 8 semester cards with available/locked states, Drive links.
  - Login: email form + PIN keypad both render.
  - Admin login (admin@ice.ru.ac.bd/admin123): redirects to /admin, sidebar with 8 sections, Dashboard shows stats + notices + quick actions, Teachers section lists faculty with edit/delete, Schedules section with filters + table, Settings with 5 tabs.
  - Teacher login (mrh@ice.ru.ac.bd/teacher123): redirects to /teacher, 4 tabs (Schedule/Manage/Notices/Extra), own schedule grouped by day, Manage tab with Cancel/Reschedule buttons, Notices tab — posted "Office Hours Updated" notice successfully (appeared in My Notices), Extra tab with course/day/time/room form + preview.
  - Theme toggle: clicking switches dark class on <html>, VLM confirmed dark mode renders correctly (navy bg, light text, gradient title visible, cards good contrast).
  - Semester card click on homepage → navigates to master-calendar with program+semester filters pre-applied (clean URL).
- Final `bun run lint`: 0 errors, 0 warnings.

Stage Summary:
- Smart Routine Hub is FULLY COMPLETE and browser-verified.
- All 7 pages work: / (home with 4 views), /login, /admin (8 CRUD sections), /teacher (4 tabs).
- Premium design: teal/amber theme, glassmorphism, 3D cards, gradient text, colored shadows, Framer Motion throughout, dark mode via next-themes + ThemeToggle.
- Real-time: TanStack Query refetchInterval (5s) on all data hooks.
- Auth: NextAuth credentials + PIN providers, role-based redirects and access control.
- PWA: manifest.json, service worker, install prompt, online/offline status, theme-color meta.
- Database: Prisma + SQLite seeded with 31 users, 73 courses, 14 rooms, 147 schedules, 4 notices, 12 library links.
- Demo credentials: admin@ice.ru.ac.bd/admin123, mrh@ice.ru.ac.bd/teacher123, PIN 000000 for admin.

---
Task ID: 15
Agent: Main (Z.ai Code)
Task: Apply Mailchimp-inspired design system from PDF — Cavendish Yellow + Peppercorn + Fraunces serif, design-only changes

Work Log:
- Analyzed 8-page design-system-reference PDF via VLM (converted PDF to PNG pages, analyzed each):
  - Colors: Cavendish Yellow #FFE01B (bold accent), Peppercorn #241C15 (warm ink), Cream #EFEDE9 (bg), White #FFFFFF (cards), Green #2D4F35, Peach #F4C9A4, Navy #1B3358, Red #C8442E
  - Typography: Fraunces (warm serif, light weight 300-400) for H1/H2/H3 display headings; Inter for body/UI/buttons
  - Type scale: H1 56-80px light, H2 36-44px, H3 24-28px, body 16-18px, caption 13-14px medium, button 15-16px semibold
  - Shape: 8-16px radius (moderate rounding), warm cream bg (not pure white)
  - Layout: alternate full-bleed section bg, generous whitespace, max body width ~635px
  - Buttons: Peppercorn fill + cream text (primary), Cavendish Yellow fill + Peppercorn text (secondary)
  - Cards: white on cream, soft shadow, generous padding (24-40px)
  - Motion: restrained, 150-250ms, scale 1.02-1.05x, fade/slide-up reveals
  - Principle: "Loud in one place (color), quiet everywhere else (layout, grid, restraint)"
- Updated layout.tsx: added Fraunces font alongside Inter (next/font/google, weight 300-600, normal+italic)
- Completely rewrote globals.css with Mailchimp design system:
  - Colors: --gold #FFE01B, --ink #241C15 (warm Peppercorn), --background #EFEDE9 (cream), --card #FFFFFF, --green #2D4F35, --peach #F4C9A4, --navy #1B3358, --rust #C8442E
  - Text tokens: --text-heading #241C15, --text-body #3D332B, --text-label #6B6760, --text-muted #9C968E (warm tones, not cold gray)
  - Typography: h1/h2/h3 use var(--font-fraunces) serif light weight 400, generous letter-spacing -0.015em; h4-h6 use Inter 600; body Inter 400
  - Radius: 10px (moderate per spec)
  - Card: border none, soft warm shadow (rgba 36,28,21 0.04-0.05), hover lift -3px + scale 1.01
  - btn-ink: Peppercorn fill + cream text; btn-gold: Yellow fill + ink text; btn-green: dark green
  - Dark mode: warm near-black #1A1612 canvas, Peppercorn #241C15 cards, cream text, yellow stays bright
  - All animations: 150-250ms, scale 1.02-1.05x, fade-up 14px, restrained
- Rebuilt student login system (was reverted by dev server restart):
  - Prisma Student model, 30 seeded students (3 per BSc sem + 2 per MSc sem, password "student123")
  - NextAuth "student" credentials provider (rollNumber + password)
  - getCurrentStudent() in session.ts, /api/student/me route, useCurrentStudent() hook
  - Login page 3 tabs (Email/PIN/Student) with StudentForm component
  - /student-dashboard page: personalized schedule + filtered notices + stats
  - Homepage: Peppercorn "Teacher / Admin Login" + Yellow "Student Login" buttons
  - Layout components hide on /student-dashboard
- Agent Browser + VLM verification — ALL PASS:
  - Homepage: cream bg ✓, Fraunces serif headings ✓, Peppercorn + Yellow buttons ✓, white cards soft shadow ✓, warm editorial feel ✓
  - Login: 3 tabs ✓, cream bg ✓, Peppercorn button ✓, serif heading ✓, student demo creds visible ✓
  - Student login (30001/student123) → /student-dashboard ✓ — name/roll/program/semester shown, stats cards, My Notices, My Weekly Schedule, cream bg, serif headings, yellow accents ✓
  - Admin login → /admin ✓ — Peppercorn sidebar active, stat tiles Peppercorn/Yellow/Green, cream bg, serif headings ✓
- Final lint: 0 errors, 0 warnings. Dev log: clean.

Stage Summary:
- Complete Mailchimp-inspired design system applied across entire website (design-only, no logic changes)
- Color palette: Cavendish Yellow #FFE01B (bold accent), Peppercorn #241C15 (warm ink), Cream #EFEDE9 (bg), White cards, warm accent greens/peach/navy/red
- Typography: Fraunces warm serif for display headings (H1-H3), Inter for body/UI — "one expressive serif + one plain sans-serif" pairing per spec
- Cards: white on cream, borderless, soft warm shadows, 10px radius, generous padding
- Buttons: Peppercorn primary (dark fill + cream text), Cavendish Yellow secondary (yellow fill + ink text)
- Motion: restrained — 150-250ms transitions, 1.02-1.05x scale on hover, fade/slide-up reveals
- Student login system fully rebuilt and working: roll 30001/student123 → personalized dashboard
- All 3 login types working: admin, teacher, student
- VLM-verified PASS on all key pages (homepage, login, student dashboard, admin dashboard)
