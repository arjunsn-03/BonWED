// All shared TypeScript types for the Wedding Planner app

export type EventType = "engagement" | "marriage";

export type OptionCategory =
  | "venue"
  | "clothing"
  | "makeup"
  | "invitations"
  | "accommodation"
  | "vendor";

export type OptionStatus =
  | "considering"
  | "shortlisted"
  | "booked"
  | "rejected";

export interface ContactInfo {
  name: string;
  phone: string;
  notes: string;
}

export interface WeddingOption {
  id: string;
  eventType: EventType;
  category: OptionCategory;
  title: string;
  status: OptionStatus;
  photos: string[]; // Firebase Storage URLs
  cost: number | null;
  contact: ContactInfo | null;
  link: string | null;
  notes: string;
  rating: number | null; // 1-5
  isFinal: boolean;
  createdBy: string; // uid
  createdAt: number; // timestamp ms
  updatedAt: number;
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export interface ScheduleItem {
  id: string;
  eventType: EventType;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  description: string;
  photos: string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  eventType: EventType;
  title: string;
  done: boolean;
  dueDate: string | null; // ISO date string
  assigneeUid: string | null;
  assigneeName: string | null;
  priority: TaskPriority;
  notes: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Invitees ─────────────────────────────────────────────────────────────────

export type GuestSide = "bride" | "groom" | "family" | "friends";
export type RsvpStatus = "pending" | "attending" | "declined" | "maybe";

export interface Guest {
  id: string;
  eventType: EventType;
  name: string;
  phone: string;
  side: GuestSide;
  rsvpStatus: RsvpStatus;
  plusOnes: number;
  notes: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Budget ───────────────────────────────────────────────────────────────────

export interface BudgetEntry {
  id: string;
  eventType: EventType;
  label: string;
  category: string;
  planned: number;
  actual: number;
  notes: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

// ─── App Settings ─────────────────────────────────────────────────────────────

export interface AppSettings {
  engagementDate: string | null; // ISO date string
  marriageDate: string | null;
  primaryColor: string; // hex
  updatedAt: number;
}

// ─── Allowed Member ───────────────────────────────────────────────────────────

export interface AllowedMember {
  id: string; // phone number (normalized)
  name: string;
  phone: string;
  addedAt: number;
  addedBy: string; // uid
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  phone: string;
  displayName: string | null;
  createdAt: number;
  lastLoginAt: number;
}
