import { mkdir, readFile, writeFile, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { hasErrorCode, getErrorMessage } from "./errors.js";

export type Guard<T> = (value: unknown) => value is T;

export interface ItemData<T> {
  nextId: number;
  items: Array<T>;
}

function isItemData<T>(value: unknown, isItem: Guard<T>): value is ItemData<T> {
  if (typeof value !== "object" || value === null) return false;

  return (
    "nextId" in value &&
    Number.isInteger(value.nextId) &&
    "items" in value &&
    Array.isArray(value.items) &&
    value.items.every(isItem)
  );
}

const DATA_FOLDER_PATH = join(import.meta.dirname, "..", "data");

export async function loadData<T>(
  fileName: string,
  isItem: Guard<T>,
): Promise<ItemData<T>> {
  let fileData: string;

  try {
    fileData = await readFile(join(DATA_FOLDER_PATH, fileName), "utf8");
  } catch (err) {
    if (hasErrorCode(err, "ENOENT")) {
      return {
        nextId: 1,
        items: [],
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

  if (!isItemData(parsed, isItem)) {
    throw new Error(
      `${fileName} has an unexpected structure. ` +
        "Fix it or delete it to start over",
    );
  }

  return parsed;
}

export async function saveData<T>(fileName: string, data: ItemData<T>) {
  const target = join(DATA_FOLDER_PATH, fileName);
  const temp = `${target}.${process.pid}.tmp`;

  try {
    await mkdir(DATA_FOLDER_PATH, { recursive: true });
    await writeFile(temp, JSON.stringify(data, null, 2));
    await rename(temp, target);
  } catch (err) {
    await rm(temp, { force: true }).catch(() => {});

    throw new Error(
      `Error while updating storage file ${fileName}: ${getErrorMessage(err)}`,
      {
        cause: err,
      },
    );
  }
}
