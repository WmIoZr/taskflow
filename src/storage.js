import { mkdir, readFile, writeFile, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { STATUSES } from "./task.js";

const DATA_FOLDER_PATH = join(import.meta.dirname, "..", "data");

export async function loadData() {
  return await readData("tasks.json");
}

export async function saveData(data) {
  await writeData("tasks.json", data);
}

async function readData(fileName) {
  let fileData;

  try {
    fileData = await readFile(join(DATA_FOLDER_PATH, fileName), "utf8");
  } catch (err) {
    if (err.code === "ENOENT") {
      return {
        nextId: 1,
        tasks: [],
      };
    }

    throw new Error(`Cannot read ${fileName}: ${err.message}`, { cause: err });
  }

  let parsed;

  try {
    parsed = JSON.parse(fileData);
  } catch (err) {
    throw new Error(
      `JSON file ${fileName} is corrupted. ` +
        "Fix it or delete it to start over",
      { cause: err },
    );
  }

  validateFileStructure(parsed, fileName);

  return parsed;
}

function validateFileStructure(parsed, fileName) {
  const isValid =
    Number.isInteger(parsed?.nextId) &&
    Array.isArray(parsed?.tasks) &&
    parsed.tasks.every(
      (task) => Number.isInteger(task?.id) && STATUSES.has(task.status),
    );

  if (!isValid) {
    throw new Error(
      `${fileName} has an unexpected structure. Fix it or delete to start over`,
    );
  }
}

async function writeData(fileName, data) {
  const target = join(DATA_FOLDER_PATH, fileName);
  const temp = `${target}.${process.pid}.tmp`;

  try {
    await mkdir(DATA_FOLDER_PATH, { recursive: true });
    await writeFile(temp, JSON.stringify(data, null, 2));
    await rename(temp, target);
  } catch (err) {
    await rm(temp, { force: true }).catch(() => {});

    throw new Error(`Error while updating storage file: ${err.message}`, {
      cause: err,
    });
  }
}
