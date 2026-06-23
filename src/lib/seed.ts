// Smart Routine Hub — Database seed
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { TEACHER_PROFILES, COURSE_NAMES, DEFAULT_SETTINGS, type DayOfWeek } from "@/types";

interface RawEntry {
  day: DayOfWeek;
  start: string;
  end: string;
  code: string;
  teacher: string;
  room: string;
  semester: number;
  program: "bsc" | "msc";
  type?: "theory" | "lab";
  section?: string;
}

// Time slots used by the routine
const SLOTS = [
  { label: "Period 1", start: "09:30 AM", end: "10:30 AM", order: 1 },
  { label: "Period 2", start: "10:30 AM", end: "11:30 AM", order: 2 },
  { label: "Period 3", start: "11:30 AM", end: "12:30 PM", order: 3 },
  { label: "Period 4", start: "12:30 PM", end: "01:30 PM", order: 4 },
  { label: "Period 5", start: "02:15 PM", end: "03:15 PM", order: 5 },
  { label: "Period 6", start: "03:15 PM", end: "04:15 PM", order: 6 },
];

// Room definitions
const ROOMS = [
  { roomNumber: "101", building: "3rd Science Building", type: "classroom", capacity: 50 },
  { roomNumber: "102", building: "3rd Science Building", type: "classroom", capacity: 50 },
  { roomNumber: "109", building: "3rd Science Building", type: "classroom", capacity: 40 },
  { roomNumber: "111", building: "3rd Science Building", type: "lab", capacity: 35 },
  { roomNumber: "116", building: "3rd Science Building", type: "lab", capacity: 35 },
  { roomNumber: "130", building: "ICE Building", type: "classroom", capacity: 45 },
  { roomNumber: "131", building: "ICE Building", type: "classroom", capacity: 45 },
  { roomNumber: "136", building: "ICE Building", type: "classroom", capacity: 45 },
  { roomNumber: "137", building: "ICE Building", type: "classroom", capacity: 45 },
  { roomNumber: "228", building: "ICE Building", type: "classroom", capacity: 60 },
  { roomNumber: "249", building: "ICE Building", type: "lab", capacity: 40 },
  { roomNumber: "Lab-A", building: "ICE Building", type: "lab", capacity: 30 },
  { roomNumber: "Lab-B", building: "ICE Building", type: "lab", capacity: 30 },
  { roomNumber: "Seminar Hall", building: "ICE Building", type: "seminar", capacity: 120 },
];

// Teacher list from the routine
const TEACHER_KEYS = Object.keys(TEACHER_PROFILES);

// Raw routine extracted from the PDF (Saturday - Thursday)
// Each tuple: [day, slotIndex, courseCode, teacherInitials, room, semester, section?]
type Row = [DayOfWeek, number, string, string, string, number, string?];

const RAW: Row[] = [
  // ===== Saturday =====
  ["Saturday", 0, "CSE423", "MAH", "137", 8],
  ["Saturday", 1, "CSE421", "MMH", "137", 8],
  ["Saturday", 2, "CSE469", "TR", "228", 8],
  ["Saturday", 3, "MGT417", "MSI", "131", 8],
  ["Saturday", 4, "MGT417", "MSI", "130", 8],

  ["Saturday", 2, "CSE413", "NS", "131", 7],
  ["Saturday", 3, "CSE415", "IAZ", "101", 7],
  ["Saturday", 5, "CSE416", "IAZ", "136", 7],

  ["Saturday", 1, "CSE313", "MSI", "228", 5],
  ["Saturday", 3, "CSE315", "MRH", "228", 5],
  ["Saturday", 4, "CSE311", "PKS", "137", 5],

  ["Saturday", 0, "CSE223", "PKS", "136", 4],
  ["Saturday", 1, "CSE224", "PKS", "136", 4],
  ["Saturday", 3, "CSE227", "MMH", "136", 4],
  ["Saturday", 4, "CSE229", "EA", "102", 4],

  ["Saturday", 2, "CSE216", "FH", "137", 3],
  ["Saturday", 1, "CSE214", "IAZ", "130", 3],
  ["Saturday", 4, "MAT213", "MO", "228", 3],
  ["Saturday", 5, "BAN211", "AUM", "102", 3],

  ["Saturday", 0, "ENG127", "MMB", "101", 2],
  ["Saturday", 1, "MAT125", "RH", "101", 2],
  ["Saturday", 2, "PHY121", "HI", "102", 2],
  ["Saturday", 2, "EEE128", "MHR", "111", 2],
  ["Saturday", 4, "PHY122", "MHR", "116", 2],

  ["Saturday", 0, "CSE113", "MSI", "228", 1],
  ["Saturday", 1, "MAT115", "MAA", "249", 1],
  ["Saturday", 2, "ENG111", "NA", "101", 1],
  ["Saturday", 4, "PHY111", "SNS", "101", 1],
  ["Saturday", 5, "CSE117", "MRH", "228", 1],

  // ===== Sunday =====
  ["Sunday", 1, "CSE469", "FH", "102", 7],
  ["Sunday", 2, "CSE411", "AAZ", "131", 7],
  ["Sunday", 3, "CSE411", "AAZ", "131", 7],
  ["Sunday", 4, "CSE412", "AAZ", "131", 7],

  ["Sunday", 0, "CSE322", "EA", "136", 6],
  ["Sunday", 3, "CSE322", "EA", "101", 6],
  ["Sunday", 5, "MAT323", "MRI", "102", 6],

  ["Sunday", 0, "CSE311", "AR", "130", 5],
  ["Sunday", 1, "CSE315", "MRH", "130", 5],
  ["Sunday", 2, "CSE316", "MRH", "130", 5],
  ["Sunday", 4, "MAT317", "MRI", "228", 5],
  ["Sunday", 1, "CSE318", "PKS", "131", 5],
  ["Sunday", 2, "CSE317", "PKS", "101", 5],
  ["Sunday", 5, "CSE311", "PKS", "137", 5],

  ["Sunday", 2, "CSE214", "NS", "137", 3],
  ["Sunday", 0, "ACT215", "MMI", "228", 3],
  ["Sunday", 1, "MAT217", "MO", "228", 3],
  ["Sunday", 5, "BAN211", "AUM", "101", 3],
  ["Sunday", 2, "CSE216", "FH", "136", 3],

  ["Sunday", 1, "PHY121", "AFS", "249", 2],
  ["Sunday", 0, "CSE122", "TR", "137", 2],
  ["Sunday", 2, "CSE121", "TR", "228", 2],
  ["Sunday", 4, "CSE122", "TR", "130", 2],
  ["Sunday", 4, "EEE128", "AFS", "111", 2],

  // ===== Monday =====
  ["Monday", 0, "CSE117", "MRH", "101", 1],
  ["Monday", 0, "EEE117", "NHF", "101", 1],
  ["Monday", 0, "MAT115", "MAA", "102", 1],
  ["Monday", 0, "CSE113", "MSI", "102", 1],
  ["Monday", 1, "MAT115", "MAA", "102", 1],
  ["Monday", 1, "CSE113", "MSI", "228", 1],
  ["Monday", 1, "CSE112", "IAZ", "136", 1],

  ["Monday", 2, "CSE469", "TR", "137", 8],
  ["Monday", 2, "CSE421", "MMH", "137", 8],
  ["Monday", 2, "CSE423", "MAH", "228", 8],

  ["Monday", 3, "CSE417", "EA", "131", 7],
  ["Monday", 3, "CSE419", "MMH", "137", 7],
  ["Monday", 3, "CSE418", "EA", "131", 7],

  ["Monday", 4, "MGT329", "NF", "228", 6],
  ["Monday", 4, "CSE321", "EA", "102", 6],
  ["Monday", 4, "CSE325", "NS", "102", 6],

  ["Monday", 5, "CSE311", "AR", "130", 5],
  ["Monday", 5, "CSE317", "PKS", "130", 5],
  ["Monday", 5, "MAT317", "MRI", "228", 5],
  ["Monday", 5, "CSE315", "MRH", "137", 5],
  ["Monday", 5, "CSE316", "MRH", "136", 5],

  // ===== Tuesday =====
  ["Tuesday", 0, "CSE415", "IAZ", "137", 7],
  ["Tuesday", 0, "CSE419", "MMH", "137", 7],
  ["Tuesday", 0, "CSE417", "EA", "228", 7],

  ["Tuesday", 1, "MAT323", "MRI", "102", 6],
  ["Tuesday", 1, "CSE325", "NS", "131", 6],
  ["Tuesday", 1, "CSE326", "NS", "131", 6],
  ["Tuesday", 1, "CSE323", "MAH", "136", 6],
  ["Tuesday", 1, "MGT329", "NF", "101", 6],

  ["Tuesday", 2, "CSE313", "MSI", "130", 5],
  ["Tuesday", 2, "CSE314", "MSI", "130", 5],
  ["Tuesday", 2, "CSE317", "PKS", "130", 5],
  ["Tuesday", 2, "CSE318", "PKS", "130", 5],

  ["Tuesday", 3, "CSE223", "PKS", "136", 4],
  ["Tuesday", 3, "CSE221", "MAH", "136", 4],
  ["Tuesday", 3, "CSE222", "MAH", "136", 4],
  ["Tuesday", 3, "CSE229", "EA", "228", 4],
  ["Tuesday", 3, "ENS221", "JF", "228", 4],

  ["Tuesday", 4, "CSE213", "NS", "131", 3],
  ["Tuesday", 4, "ACT215", "MMI", "228", 3],
  ["Tuesday", 4, "CSE215", "FH", "228", 3],
  ["Tuesday", 4, "MAT213", "MO", "101", 3],

  ["Tuesday", 5, "ENG127", "MMB", "228", 2],
  ["Tuesday", 5, "MAT125", "RH", "102", 2],
  ["Tuesday", 5, "EEE127", "NS", "131", 2],

  // ===== Wednesday =====
  ["Wednesday", 0, "CSE423", "MAH", "228", 8],
  ["Wednesday", 1, "CSE413", "NS", "228", 8],
  ["Wednesday", 2, "CSE414", "NS", "131", 8],

  ["Wednesday", 3, "CSE323", "MAH", "136", 6],
  ["Wednesday", 3, "CSE324", "MAH", "136", 6],

  ["Wednesday", 4, "CSE315", "MRH", "130", 5],
  ["Wednesday", 4, "CSE313", "MSI", "130", 5],
  ["Wednesday", 5, "CSE314", "MSI", "131", 5],
  ["Wednesday", 5, "CSE313", "MSI", "137", 5],

  ["Wednesday", 3, "CSE225", "TAS", "101", 4],
  ["Wednesday", 3, "CSE226", "TAS", "109", 4],

  ["Wednesday", 4, "CSE213", "NS", "136", 3],
  ["Wednesday", 4, "CSE215", "FH", "228", 3],

  ["Wednesday", 5, "PHY121", "AFS", "249", 2],
  ["Wednesday", 5, "EEE127", "NS", "136", 2],
  ["Wednesday", 5, "CSE121", "TR", "228", 2],
  ["Wednesday", 5, "PHY122", "SS", "116", 2],

  ["Wednesday", 5, "ENG111", "NA", "101", 1],
  ["Wednesday", 5, "PHY111", "SNS", "249", 1],
  ["Wednesday", 5, "EEE117", "NHF", "249", 1],
  ["Wednesday", 5, "CSE112", "TFS", "137", 1],
  ["Wednesday", 5, "MAT115", "MAA", "101", 1],
  ["Wednesday", 5, "CSE117", "MRH", "136", 1],

  // ===== Thursday (additional labs + MSc) =====
  ["Thursday", 0, "CSE114", "MSI", "249", 1],
  ["Thursday", 1, "CSE114", "MSI", "249", 1],
  ["Thursday", 2, "CSE124", "TR", "111", 2],
  ["Thursday", 3, "CSE124", "TR", "111", 2],
  ["Thursday", 0, "CSE214", "NS", "130", 3],
  ["Thursday", 1, "CSE216", "FH", "130", 3],
  ["Thursday", 2, "CSE222", "MAH", "111", 4],
  ["Thursday", 3, "CSE226", "TAS", "109", 4],
  ["Thursday", 4, "CSE314", "MSI", "111", 5],
  ["Thursday", 5, "CSE316", "MRH", "249", 5],
  ["Thursday", 0, "CSE326", "NS", "249", 6],
  ["Thursday", 1, "CSE324", "MAH", "111", 6],
  ["Thursday", 2, "CSE412", "AAZ", "111", 7],
  ["Thursday", 3, "CSE416", "IAZ", "249", 7],
  ["Thursday", 4, "CSE418", "EA", "130", 7],
  ["Thursday", 5, "CSE469", "TR", "137", 8],

  // MSc (1st, 2nd, 3rd semester) — Thursday + Saturday
  ["Thursday", 0, "CSE611", "MRH", "Seminar Hall", 1, "msc"],
  ["Thursday", 1, "CSE613", "IAZ", "Seminar Hall", 1, "msc"],
  ["Thursday", 4, "CSE615", "FH", "Seminar Hall", 1, "msc"],
  ["Saturday", 4, "CSE621", "MMH", "Seminar Hall", 2, "msc"],
  ["Saturday", 5, "CSE623", "MAH", "Seminar Hall", 2, "msc"],
  ["Sunday", 4, "CSE631", "TR", "Seminar Hall", 3, "msc"],
  ["Sunday", 5, "CSE633", "NF", "Seminar Hall", 3, "msc"],
  ["Wednesday", 4, "CSE612", "MRH", "Seminar Hall", 1, "msc"],
  ["Wednesday", 4, "CSE622", "MMH", "Seminar Hall", 2, "msc"],
  ["Wednesday", 4, "CSE632", "TR", "Seminar Hall", 3, "msc"],
];

// MSc course names
const MSC_COURSE_NAMES: Record<string, string> = {
  CSE611: "Advanced Algorithms",
  CSE612: "Advanced Algorithms Lab",
  CSE613: "Advanced Database Systems",
  CSE615: "Research Methodology",
  CSE621: "Deep Learning",
  CSE622: "Deep Learning Lab",
  CSE623: "Distributed Computing",
  CSE631: "Thesis Research",
  CSE632: "Cloud-native Architecture Lab",
  CSE633: "Big Data Systems",
};

function isLabCode(code: string): boolean {
  return /(?:Lab|1[12468]|2[2468])$/.test(code) && code.endsWith("Lab")
    ? true
    : false;
}

function classTypeFor(code: string): "theory" | "lab" {
  const name = COURSE_NAMES[code] || MSC_COURSE_NAMES[code] || "";
  if (name.toLowerCase().includes("lab")) return "lab";
  if (code.endsWith("4") || code.endsWith("6") || code.endsWith("8") || code.endsWith("2")) {
    // Even-ending codes are commonly labs in this scheme
    return "lab";
  }
  return "theory";
}

function courseNameFor(code: string): string {
  return COURSE_NAMES[code] || MSC_COURSE_NAMES[code] || code;
}

export async function seedDatabase(force = false) {
  // Check existing
  const existingUsers = await db.user.count();
  if (existingUsers > 0 && !force) {
    return { skipped: true, message: "Database already seeded. Use force=true to reseed." };
  }

  if (force) {
    // Wipe (order matters due to relations)
    await db.scheduleChange.deleteMany();
    await db.notice.deleteMany();
    await db.schedule.deleteMany();
    await db.timeSlot.deleteMany();
    await db.libraryLink.deleteMany();
    await db.course.deleteMany();
    await db.room.deleteMany();
    await db.setting.deleteMany();
    await db.user.deleteMany();
  }

  // 1) Admin user
  const adminPass = await bcrypt.hash("admin123", 10);
  const admin = await db.user.create({
    data: {
      email: "admin@ice.ru.ac.bd",
      fullName: "System Administrator",
      passwordHash: adminPass,
      pinHash: await bcrypt.hash("000000", 10),
      designation: "System Administrator",
      department: "ICE, RU",
      role: "admin",
      isActive: true,
      bio: "Department administrator for Smart Routine Hub.",
    },
  });

  // 2) Teachers
  const teacherMap: Record<string, { id: string; fullName: string; email: string }> = {};
  for (const key of TEACHER_KEYS) {
    const prof = TEACHER_PROFILES[key];
    const email = `${key.toLowerCase()}@ice.ru.ac.bd`;
    const pass = await bcrypt.hash("teacher123", 10);
    const pin = await bcrypt.hash(key.padEnd(6, "0").slice(0, 6), 10);
    const u = await db.user.create({
      data: {
        email,
        fullName: prof.name,
        passwordHash: pass,
        pinHash: pin,
        designation: prof.designation,
        department: "ICE, RU",
        role: "teacher",
        isActive: true,
        officeRoom: `Room ${100 + (Object.keys(teacherMap).length % 10)}`,
        phone: "+880 1" + String(700000000 + Object.keys(teacherMap).length * 11111).slice(0, 9),
        bio: `${prof.designation} at the Department of ICE, University of Rajshahi. Research interests in computing and communication engineering.`,
      },
    });
    teacherMap[key] = { id: u.id, fullName: prof.name, email };
  }

  // 3) Rooms
  const roomMap: Record<string, string> = {};
  for (const r of ROOMS) {
    const created = await db.room.create({ data: r });
    roomMap[r.roomNumber] = created.id;
  }

  // 4) Time slots
  const slotMap: Record<number, { id: string; start: string; end: string }> = {};
  for (const s of SLOTS) {
    const ts = await db.timeSlot.create({
      data: {
        label: s.label,
        startTime: s.start,
        endTime: s.end,
        slotOrder: s.order,
        isBreak: false,
        isActive: true,
      },
    });
    slotMap[s.order] = { id: ts.id, start: s.start, end: s.end };
  }

  // 5) Courses — derive unique from routine
  const courseMap: Record<string, string> = {};
  const seenCodes = new Set<string>();
  for (const row of RAW) {
    const [, , code, , , sem, mscFlag] = row;
    if (seenCodes.has(code)) continue;
    seenCodes.add(code);
    const isMsc = mscFlag === "msc";
    const c = await db.course.create({
      data: {
        name: courseNameFor(code),
        code,
        creditHours: classTypeFor(code) === "lab" ? 1.5 : 3,
        type: classTypeFor(code),
        semester: sem,
        program: isMsc ? "msc" : "bsc",
        isActive: true,
      },
    });
    courseMap[code] = c.id;
  }

  // 6) Schedules
  let scheduleCount = 0;
  for (const row of RAW) {
    const [day, slotIdx, code, teacherInit, roomNo, sem, mscFlag] = row;
    const slot = slotMap[slotIdx + 1];
    const teacher = teacherMap[teacherInit];
    const roomId = roomMap[roomNo];
    const courseId = courseMap[code];
    if (!teacher || !roomId || !slot || !courseId) {
      continue;
    }
    const program = mscFlag === "msc" ? "msc" : "bsc";
    await db.schedule.create({
      data: {
        courseId,
        teacherId: teacher.id,
        roomId,
        timeSlotId: slot.id,
        courseName: courseNameFor(code),
        courseCode: code,
        teacherName: teacher.fullName,
        teacherInitials: teacherInit,
        roomNumber: roomNo,
        startTime: slot.start,
        endTime: slot.end,
        dayOfWeek: day,
        semester: sem,
        program,
        classType: classTypeFor(code),
        isActive: true,
      },
    });
    scheduleCount++;
  }

  // 7) Notices
  const now = new Date();
  await db.notice.createMany({
    data: [
      {
        title: "Welcome to Spring 2026 Semester",
        content:
          "Classes for the Spring 2026 semester have commenced. All students are advised to check the updated class routine on this portal. Wishing everyone a successful academic term ahead.",
        category: "academic",
        postedById: admin.id,
        postedByName: admin.fullName,
        isPinned: true,
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
        updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
      },
      {
        title: "Mid-term Examination Schedule Published",
        content:
          "The mid-term examination routine has been published. Examinations will begin from the 3rd week of the month. Please consult the exam committee notice board for detailed seating arrangements.",
        category: "exam",
        postedById: admin.id,
        postedByName: admin.fullName,
        isPinned: true,
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 20),
        updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 20),
      },
      {
        title: "Workshop on Machine Learning",
        content:
          "The ICE Department is organising a hands-on workshop on Machine Learning with Python for 5th and 6th semester students. Seats are limited — register at the department office.",
        category: "event",
        postedById: admin.id,
        postedByName: admin.fullName,
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 8),
        updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 8),
      },
      {
        title: "Library Resources Updated",
        content:
          "New course materials, lecture notes and reference books for Spring 2026 have been uploaded to the Google Library. Browse the Library section to access them.",
        category: "general",
        postedById: admin.id,
        postedByName: admin.fullName,
        createdAt: new Date(now.getTime() - 1000 * 60 * 30),
        updatedAt: new Date(now.getTime() - 1000 * 60 * 30),
      },
    ],
  });

  // 8) Library links
  const driveBase = "https://drive.google.com/drive/folders/";
  const libLinks = [];
  for (let s = 1; s <= 8; s++) {
    libLinks.push({
      degree: "bsc" as const,
      semester: s,
      url: `${driveBase}bsc-sem-${s}`,
      title: `BSc — ${["1st","2nd","3rd","4th","5th","6th","7th","8th"][s-1]} Semester`,
      isActive: s <= 6,
    });
  }
  for (let s = 1; s <= 3; s++) {
    libLinks.push({
      degree: "msc" as const,
      semester: s,
      url: `${driveBase}msc-sem-${s}`,
      title: `MSc — ${["1st","2nd","3rd"][s-1]} Semester`,
      isActive: s <= 2,
    });
  }
  libLinks.push({
    degree: "others" as const,
    semester: null,
    url: "https://drive.google.com/drive/folders/ice-others",
    title: "Others — Syllabus, Forms & Notices",
    isActive: true,
  });
  await db.libraryLink.createMany({ data: libLinks });

  // 9) Settings
  await db.setting.create({
    data: { key: "site_settings", value: JSON.stringify(DEFAULT_SETTINGS) },
  });

  return {
    skipped: false,
    admin: { email: admin.email, password: "admin123" },
    teacherSample: { email: "mrh@ice.ru.ac.bd", password: "teacher123", pin: "MRH000" },
    counts: {
      users: Object.keys(teacherMap).length + 1,
      rooms: ROOMS.length,
      timeSlots: SLOTS.length,
      courses: seenCodes.size,
      schedules: scheduleCount,
      notices: 4,
      libraryLinks: libLinks.length,
    },
  };
}
