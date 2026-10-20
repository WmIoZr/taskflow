import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  buildErrorBody,
  getBodyObject,
  HttpError,
  sendResponse,
} from "./http.js";
import { Repository } from "./repository.js";
import type { NewTask, Task } from "./task.js";
import {
  createTask,
  isPriority,
  isStatus,
  isTask,
  isValidDate,
} from "./task.js";
import { getErrorMessage } from "./errors.js";

const taskRepo = new Repository<Task>("tasks.json", isTask);
const UPDATABLE_FIELDS = ["name", "priority", "due", "status"] as const;
type UpdateTaskBody = Partial<Pick<Task, (typeof UPDATABLE_FIELDS)[number]>>;

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://localhost");

    const parsedPath: Array<string> = url.pathname.split("/").filter(Boolean);

    switch (parsedPath[0]) {
      case "tasks": {
        await handleTasksRequest(request, response, parsedPath);
        break;
      }

      default: {
        throw new HttpError(404, `Invalid path: ${url.pathname}`);
      }
    }
  } catch (err) {
    if (err instanceof HttpError) {
      const body = buildErrorBody(err.message, request.url);
      sendResponse(response, err.status, body);
      return;
    }
    console.error(err);

    const body = buildErrorBody("Internal server error", request.url);
    sendResponse(response, 500, body);
  }
});

server.listen(3000, () => console.log("Listening on http://localhost:3000"));

async function handleTasksRequest(
  request: IncomingMessage,
  response: ServerResponse,
  parsedPath: Array<string>,
) {
  switch (parsedPath.length) {
    case 1: {
      await handleTasksCollection(request, response);
      break;
    }

    case 2: {
      const id = parsedPath[1];
      if (id === undefined || !/^\d+$/.test(id)) {
        throw new HttpError(400, `Invalid id: ${id}`);
      }

      await handleTaskItem(request, response, Number(id));

      break;
    }
    default:
      throw new HttpError(404, `Invalid path: ${request.url}`);
  }
}

async function handleTasksCollection(
  request: IncomingMessage,
  response: ServerResponse,
) {
  switch (request.method) {
    case "GET": {
      sendResponse(response, 200, await taskRepo.findAll());
      break;
    }

    case "POST": {
      const body = await getBodyObject(request);

      if (!isCreateTaskBody(body)) {
        throw new HttpError(
          400,
          `Validation failed for the submitted data: ${JSON.stringify(body)}`,
        );
      }

      let newTask: NewTask;
      try {
        newTask = createTask(body.name, body.priority, body.due);
      } catch (err) {
        throw new HttpError(
          400,
          `Validation failed for the submitted data: ${JSON.stringify(body)}, cause: ${getErrorMessage(err)}`,
        );
      }

      sendResponse(response, 201, await taskRepo.create(newTask));

      break;
    }

    default: {
      throw new HttpError(
        405,
        `Method ${request.method} not allowed on ${request.url}`,
      );
    }
  }
}

async function handleTaskItem(
  request: IncomingMessage,
  response: ServerResponse,
  id: number,
) {
  switch (request.method) {
    case "GET": {
      const taskFound = await taskRepo.findById(id);
      if (taskFound === undefined) {
        throw new HttpError(404, `Task #${id} not found`);
      }

      sendResponse(response, 200, taskFound);

      break;
    }

    case "PATCH": {
      const body: unknown = await getBodyObject(request);
      if (!isUpdateTaskBody(body)) {
        throw new HttpError(
          400,
          `Validation failed for the submitted data: ${JSON.stringify(body)}`,
        );
      }

      const changes: UpdateTaskBody = {};
      for (const field of UPDATABLE_FIELDS) {
        copyIfDefined(changes, body, field);
      }

      const updatedTask = await taskRepo.update(id, changes);

      if (updatedTask === undefined) {
        throw new HttpError(404, `Task #${id} not found`);
      }

      sendResponse(response, 200, updatedTask);

      break;
    }

    case "DELETE": {
      if (await taskRepo.delete(id)) sendResponse(response, 204);
      else throw new HttpError(404, `Task #${id} not found`);

      break;
    }

    default: {
      throw new HttpError(
        405,
        `Method ${request.method} not allowed on ${request.url}`,
      );
    }
  }
}

function copyIfDefined<K extends keyof UpdateTaskBody>(
  target: UpdateTaskBody,
  source: UpdateTaskBody,
  key: K,
) {
  if (source[key] !== undefined) target[key] = source[key];
}

function isUpdateTaskBody(value: unknown): value is UpdateTaskBody {
  if (typeof value !== "object" || value == null) return false;

  return (
    (!("name" in value) ||
      (typeof value.name === "string" && value.name.trim() !== "")) &&
    (!("priority" in value) ||
      (typeof value.priority === "string" && isPriority(value.priority))) &&
    (!("due" in value) ||
      (typeof value.due === "string" && isValidDate(value.due)) ||
      value.due === null) &&
    (!("status" in value) ||
      (typeof value.status === "string" && isStatus(value.status)))
  );
}

interface CreateTaskBody {
  name?: string;
  priority?: string;
  due?: string;
}

function isCreateTaskBody(value: unknown): value is CreateTaskBody {
  if (typeof value !== "object" || value == null) return false;

  return (
    (!("name" in value) || typeof value.name === "string") &&
    (!("priority" in value) || typeof value.priority === "string") &&
    (!("due" in value) || typeof value.due === "string")
  );
}
