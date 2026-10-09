import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

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

  try {
    return JSON.parse(fileData);
  } catch (err) {
    throw new Error(
      `JSON file ${fileName} is corrupted. ` +
        "Fix it or delete it to start over",
    );
  }
}

async function writeData(fileName, data) {
  await mkdir(DATA_FOLDER_PATH, { recursive: true });
  await writeFile(
    join(DATA_FOLDER_PATH, fileName),
    JSON.stringify(data, null, 2),
  );
}
