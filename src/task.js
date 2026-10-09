export const PRIORITIES = new Set(["low", "medium", "high"]);
export const STATUSES = new Set(["todo", "done"]);
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export function createTask(name, priority, due) {
  const task = {};

  if (name === undefined || name.trim() === "") {
    throw new Error("Name for task is required for creation");
  }
  task.name = name.trim();
  task.priority = validatePriority(priority);
  task.due = validateDate(due);
  task.status = "todo";

  return task;
}

function validateDate(stringDate) {
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

function validatePriority(priority) {
  if (priority === undefined) {
    return "medium";
  }

  priority = priority.trim().toLowerCase();

  if (!PRIORITIES.has(priority)) {
    throw new Error("Priority option should be low/medium/high");
  }

  return priority;
}
