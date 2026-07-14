/**
 * Firestore collection/document path helpers.
 * Having them here prevents typos and makes refactoring easy.
 */

export const COLLECTIONS = {
  allowlist: "allowlist",
  users: "users",
  settings: "settings",

  // Per-event sub-collections are stored as top-level collections
  // with a field `eventType: "engagement" | "marriage"` for easy querying.
  options: "options",
  scheduleItems: "scheduleItems",
  tasks: "tasks",
  guests: "guests",
  budgetEntries: "budgetEntries",
} as const;

export const SETTINGS_DOC_ID = "app";
