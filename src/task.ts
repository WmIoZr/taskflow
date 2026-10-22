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
  projectId: number;
  createdAt: string;
}

export function isTask(value: unknown): value is Task {
  if (typeof value !== "object" || value === null) return false;

  return (
    "id" in value &&
    Number.isInteger(value.id) &&
    "name" in value &&
    typeof value.name === "string" &&
    value.name.trim() !== "" &&
    "priority" in value &&
    typeof value.priority === "string" &&
    isPriority(value.priority) &&
    "due" in value &&
    (typeof value.due === "string" || value.due === null) &&
    "status" in value &&
    typeof value.status === "string" &&
    isStatus(value.status) &&
    "projectId" in value &&
    Number.isInteger(value.projectId) &&
    "createdAt" in value &&
    typeof value.createdAt === "string"
  );
}

export type NewTask = Omit<Task, "id">;

export function createTask(
  name?: string,
  priority?: string,
  due?: string | null,
  projectId?: number,
): NewTask {
  if (name === undefined || name.trim() === "") {
    throw new Error("Name for task is required for creation");
  }
  if (
    projectId === undefined ||
    !Number.isInteger(projectId) ||
    projectId < 1
  ) {
    throw new Error("Project id must be a positive integer");
  }

  return {
    name: name.trim(),
    priority: validatePriority(priority),
    due: due === null ? due : validateDate(due),
    status: "todo",
    projectId: projectId,
    createdAt: new Date().toISOString(),
  };
}

export function isValidDate(stringDate: string): boolean {
  if (!DATE_FORMAT.test(stringDate)) {
    return false;
  }

  const date = new Date(stringDate);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === stringDate
  );
}

function validateDate(stringDate?: string) {
  if (stringDate == undefined) {
    return null;
  }

  stringDate = stringDate.trim();

  if (!isValidDate(stringDate)) {
    throw new Error(
      `Invalid date: ${stringDate}. Expected a real date as YYYY-MM-DD`,
    );
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
