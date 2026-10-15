export const PRIORITIES = ["low", "medium", "high"] as const;
const PRIORITIES_SET: ReadonlySet<string> = new Set(PRIORITIES);
export type Priority = (typeof PRIORITIES)[number];

export const STATUSES = ["todo", "in_progress", "done"] as const;
const STATUSES_SET: ReadonlySet<string> = new Set(STATUSES);
export type Status = (typeof STATUSES)[number];

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export interface Task {
  id: number;
  name: string;
  priority: Priority;
  due: string | null;
  status: Status;
  createdAt: string;
}

export type NewTask = Omit<Task, "id" | "createdAt">;

export function createTask(
  name?: string,
  priority?: string,
  due?: string,
): NewTask {
  if (name === undefined || name.trim() === "") {
    throw new Error("Name for task is required for creation");
  }

  return {
    name: name.trim(),
    priority: validatePriority(priority),
    due: validateDate(due),
    status: "todo",
  };
}

function validateDate(stringDate?: string) {
  if (stringDate === undefined) {
    return null;
  }

  stringDate = stringDate.trim();

  if (!DATE_FORMAT.test(stringDate)) {
    throw new Error(`Invalid date format: ${stringDate}. Expected YYYY-MM-DD`);
  }

  const date = new Date(stringDate);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== stringDate
  ) {
    throw new Error(`Invalid date: ${stringDate}`);
  }

  return stringDate;
}

function validatePriority(priority?: string) {
  if (priority === undefined) {
    return "medium";
  }

  priority = priority.trim().toLowerCase();

  if (!isPriority(priority)) {
    throw new Error(`Priority option should be ${PRIORITIES.join("/")}`);
  }

  return priority;
}

export function isPriority(priority: string): priority is Priority {
  return PRIORITIES_SET.has(priority);
}

export function isStatus(status: string): status is Status {
  return STATUSES_SET.has(status);
}
