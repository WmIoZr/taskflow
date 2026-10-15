import { mkdir, readFile, writeFile, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { isTask, type Task } from "./task.js";
import { hasErrorCode, getErrorMessage } from "./errors.js";

interface TaskData {
  nextId: number;
  tasks: Array<Task>;
}

function isTaskData(value: unknown): value is TaskData {
  if (typeof value !== "object" || value === null) return false;

  return (
    "nextId" in value &&
    Number.isInteger(value.nextId) &&
    "tasks" in value &&
    Array.isArray(value.tasks) &&
    value.tasks.every(isTask)
  );
}

const DATA_FOLDER_PATH = join(import.meta.dirname, "..", "data");

export async function loadData(): Promise<TaskData> {
  return await readData("tasks.json");
}

export async function saveData(data: TaskData) {
  await writeData("tasks.json", data);
}

async function readData(fileName: string): Promise<TaskData> {
  let fileData: string;

  try {
    fileData = await readFile(join(DATA_FOLDER_PATH, fileName), "utf8");
  } catch (err) {
    if (hasErrorCode(err, "ENOENT")) {
      return {
        nextId: 1,
        tasks: [],
      };
    }

    throw new Error(`Cannot read ${fileName}: ${getErrorMessage(err)}`, {
      cause: err,
    });
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(fileData);
  } catch (err) {
    throw new Error(
      `JSON file ${fileName} is corrupted. ` +
        "Fix it or delete it to start over",
      { cause: err },
    );
  }

  if (!isTaskData(parsed)) {
    throw new Error(
      `${fileName} has an unexpected structure. ` +
        "Fix it or delete it to start over",
    );
  }

  return parsed;
}

async function writeData(fileName: string, data: TaskData) {
  const target = join(DATA_FOLDER_PATH, fileName);
  const temp = `${target}.${process.pid}.tmp`;

  try {
    await mkdir(DATA_FOLDER_PATH, { recursive: true });
    await writeFile(temp, JSON.stringify(data, null, 2));
    await rename(temp, target);
  } catch (err) {
    await rm(temp, { force: true }).catch(() => {});

    throw new Error(
      `Error while updating storage file: ${getErrorMessage(err)}`,
      {
        cause: err,
      },
    );
  }
}
