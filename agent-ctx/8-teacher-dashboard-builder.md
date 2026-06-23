# Task 8: Teacher Dashboard Builder

## Summary
Built the Teacher Dashboard at `/home/z/my-project/src/app/teacher/page.tsx` with all 4 required tabs and real-time updates.

## Files Created
- `src/app/teacher/page.tsx` — Main page (auth protection, header, tabs, admin teacher picker)
- `src/components/teacher/my-schedule-tab.tsx` — Filters + stats + cards/list views
- `src/components/teacher/cancel-reschedule-tab.tsx` — Cancel & Reschedule dialogs with room availability
- `src/components/teacher/notices-tab.tsx` — Create notice form + my-notices list (delete)
- `src/components/teacher/extra-class-tab.tsx` — Schedule extra class form with live preview
- `src/components/teacher/realtime-notification-bar.tsx` — Fixed bottom notification bar

## Files Modified
- `src/components/layout/mobile-header.tsx` — Hide on /teacher, /admin, /login paths (so dashboards provide their own headers)

## Key Patterns Used
- Auth: `useSession()` for status, `useCurrentUser()` for the user object, redirect to /login if unauthenticated, AccessDenied if role !== teacher/admin
- Real-time: `useRealtimeSchedules({ teacherId, ...filters })`, `useRealtimeScheduleChanges({ teacherId })`, `useRealtimeNotices()`, `useRealtimeTimeSlots()`, `useRealtimeRooms()`, `useRealtimeCourses()`, `useRealtimeTeachers()` — all refetch every 5s
- Mutations: TanStack Query `useMutation` + `queryClient.invalidateQueries(['schedule-changes','notices','schedules'])` + sonner toast feedback
- Room availability: `useQuery(['available-rooms', day, start, end], ...)` with `enabled` flag — only fetches when day+time picked
- Design system: card-3d, glass-premium, btn-3d, stat-card-premium, hero-bg, text-gradient-primary, shadow-teal-glow/amber-glow, teal/emerald for theory, amber/orange for lab
- Framer Motion: whileHover lift, whileTap scale, stagger on lists, AnimatePresence on notification bar

## Admin Viewing
Admins get an AdminTeacherPicker banner (sticky below header) to select any teacher. effectiveTeacherId is used in schedule/management/extra tabs; notices tab always uses admin's own id for posting.

## Lint Status
`bun run lint` → 0 errors. Only pre-existing warnings in other agents' files.

## API Routes Used
- GET `/api/schedules?teacherId=xxx` — teacher's schedule
- GET `/api/schedule-changes?teacherId=xxx` — recent changes
- POST `/api/schedule-changes` — create cancel/reschedule/room_changed/extra_class (auto-creates notice)
- GET `/api/notices` — all approved notices
- POST `/api/notices` — create notice
- DELETE `/api/notices?id=xxx` — delete notice (teachers can only delete their own, enforced server-side)
- GET `/api/rooms?day=&startTime=&endTime=&type=` — rooms with `available: boolean` flag
- GET `/api/courses` — all active courses
- GET `/api/timeslots` — all time slots
- GET `/api/user` — current user
- GET `/api/teachers` — all teachers (for admin picker)
