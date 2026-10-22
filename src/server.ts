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
  PRIORITIES,
  STATUSES,
} from "./task.js";
import { getErrorMessage } from "./errors.js";
import {
  createProject,
  isProject,
  type NewProject,
  type Project,
} from "./project.js";
import type { Guard } from "./storage.js";

const taskRepo = new Repository<Task>("tasks.json", isTask);
const TASK_UPDATABLE_FIELDS = [
  "name",
  "priority",
  "due",
  "status",
  "projectId",
] as const;
type UpdateTaskBody = Partial<
  Pick<Task, (typeof TASK_UPDATABLE_FIELDS)[number]>
>;

const projectRepo = new Repository<Project>("projects.json", isProject);
const PROJECT_UPDATABLE_FIELDS = ["name", "description"] as const;
type UpdateProjectBody = Partial<
  Pick<Project, (typeof PROJECT_UPDATABLE_FIELDS)[number]>
>;

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://localhost");

    const parsedPath: Array<string> = url.pathname.split("/").filter(Boolean);

    switch (parsedPath[0]) {
      case "tasks": {
        await handleTasksRequest(request, response, parsedPath, url);
        break;
      }

      case "projects": {
        await handleProjectsRequest(request, response, parsedPath);
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

server.listen(3000, "127.0.0.1", () =>
  console.log("Listening on http://localhost:3000"),
);

async function handleProjectsRequest(
  request: IncomingMessage,
  response: ServerResponse,
  parsedPath: Array<string>,
) {
  switch (parsedPath.length) {
    case 1: {
      await handleProjectsCollection(request, response);
      break;
    }

    case 2: {
      await handleProjectItem(request, response, parseId(parsedPath[1]));
      break;
    }
    default:
      throw new HttpError(404, `Invalid path: ${request.url}`);
  }
}

async function handleProjectsCollection(
  request: IncomingMessage,
  response: ServerResponse,
) {
  switch (request.method) {
    case "GET": {
      sendResponse(response, 200, await projectRepo.findAll());
      break;
    }

    case "POST": {
      const body = await readValidBody(request, isCreateProjectBody);

      let newProject: NewProject;
      try {
        newProject = createProject(body.name, body.description);
      } catch (err) {
        throw new HttpError(
          400,
          `Validation failed for the submitted data: ${JSON.stringify(body)}, cause: ${getErrorMessage(err)}`,
        );
      }

      sendResponse(response, 201, await projectRepo.create(newProject));

      break;
    }

    default: {
      throwMethodNotAllowed(request);
    }
  }
}

async function handleProjectItem(
  request: IncomingMessage,
  response: ServerResponse,
  id: number,
) {
  switch (request.method) {
    case "GET": {
      const projectFound = await projectRepo.findById(id);
      if (projectFound === undefined) {
        throw new HttpError(404, `Project #${id} not found`);
      }

      sendResponse(response, 200, projectFound);

      break;
    }

    case "PATCH": {
      const body = await readValidBody(request, isUpdateProjectBody);

      const changes: UpdateProjectBody = {};
      for (const field of PROJECT_UPDATABLE_FIELDS) {
        copyIfDefined(changes, body, field);
      }
      if (changes.name !== undefined) changes.name = changes.name.trim();
      if (changes.description != null)
        changes.description = changes.description.trim() || null;

      const updatedProject = await projectRepo.update(id, changes);

      if (updatedProject === undefined) {
        throw new HttpError(404, `Project #${id} not found`);
      }

      sendResponse(response, 200, updatedProject);

      break;
    }

    case "DELETE": {
      if ((await taskRepo.findAll()).some((task) => task.projectId === id)) {
        throw new HttpError(409, `Project #${id} still has tasks`);
      }

      if (await projectRepo.delete(id)) sendResponse(response, 204);
      else throw new HttpError(404, `Project #${id} not found`);

      break;
    }

    default: {
      throwMethodNotAllowed(request);
    }
  }
}

async function handleTasksRequest(
  request: IncomingMessage,
  response: ServerResponse,
  parsedPath: Array<string>,
  url: URL,
) {
  switch (parsedPath.length) {
    case 1: {
      await handleTasksCollection(request, response, url);
      break;
    }

    case 2: {
      await handleTaskItem(request, response, parseId(parsedPath[1]));
      break;
    }
    default:
      throw new HttpError(404, `Invalid path: ${request.url}`);
  }
}

function parseUnionValue<T extends string>(
  value: string,
  guard: (value: string) => value is T,
  allowed: readonly T[],
): T {
  if (!guard(value)) {
    throw new HttpError(
      400,
      `Invalid value passed: ${value}. Expected ${allowed.join("/")}`,
    );
  }

  return value;
}

async function handleTasksCollection(
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
) {
  switch (request.method) {
    case "GET": {
      const rawStatus = url.searchParams.get("status")?.trim().toLowerCase();
      const rawPriority = url.searchParams
        .get("priority")
        ?.trim()
        .toLowerCase();

      let resultCollection: Task[] = await taskRepo.findAll();
      if (rawStatus !== undefined) {
        const statusFilter = parseUnionValue(rawStatus, isStatus, STATUSES);
        resultCollection = resultCollection.filter(
          (task) => task.status === statusFilter,
        );
      }
      if (rawPriority !== undefined) {
        const priorityFilter = parseUnionValue(
          rawPriority,
          isPriority,
          PRIORITIES,
        );
        resultCollection = resultCollection.filter(
          (task) => task.priority === priorityFilter,
        );
      }

      sendResponse(response, 200, resultCollection);
      break;
    }

    case "POST": {
      const body = await readValidBody(request, isCreateTaskBody);

      if (
        body.projectId !== undefined &&
        !(await projectRepo.findById(body.projectId))
      ) {
        throw new HttpError(400, `Project #${body.projectId} does not exist`);
      }

      let newTask: NewTask;
      try {
        newTask = createTask(
          body.name,
          body.priority,
          body.due,
          body.projectId,
        );
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
      throwMethodNotAllowed(request);
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
      const body = await readValidBody(request, isUpdateTaskBody);

      if (
        body.projectId !== undefined &&
        !(await projectRepo.findById(body.projectId))
      ) {
        throw new HttpError(400, `Project #${body.projectId} does not exist`);
      }

      const changes: UpdateTaskBody = {};
      for (const field of TASK_UPDATABLE_FIELDS) {
        copyIfDefined(changes, body, field);
      }
      if (changes.name !== undefined) changes.name = changes.name.trim();

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
      throwMethodNotAllowed(request);
    }
  }
}

function copyIfDefined<T, K extends keyof T>(target: T, source: T, key: K) {
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
      (typeof value.status === "string" && isStatus(value.status))) &&
    (!("projectId" in value) ||
      (typeof value.projectId === "number" &&
        Number.isInteger(value.projectId) &&
        value.projectId > 0))
  );
}

function isUpdateProjectBody(value: unknown): value is UpdateProjectBody {
  if (typeof value !== "object" || value == null) return false;

  return (
    (!("name" in value) ||
      (typeof value.name === "string" && value.name.trim() !== "")) &&
    (!("description" in value) ||
      typeof value.description === "string" ||
      value.description === null)
  );
}

interface CreateTaskBody {
  name?: string;
  priority?: string;
  due?: string | null;
  projectId?: number;
}

function isCreateTaskBody(value: unknown): value is CreateTaskBody {
  if (typeof value !== "object" || value == null) return false;

  return (
    (!("name" in value) || typeof value.name === "string") &&
    (!("priority" in value) || typeof value.priority === "string") &&
    (!("due" in value) ||
      typeof value.due === "string" ||
      value.due === null) &&
    (!("projectId" in value) ||
      (typeof value.projectId === "number" &&
        Number.isInteger(value.projectId) &&
        value.projectId > 0))
  );
}

interface CreateProjectBody {
  name?: string;
  description?: string | null;
}

function isCreateProjectBody(value: unknown): value is CreateProjectBody {
  if (typeof value !== "object" || value == null) return false;

  return (
    (!("name" in value) || typeof value.name === "string") &&
    (!("description" in value) ||
      typeof value.description === "string" ||
      value.description === null)
  );
}

function parseId(segment: string | undefined): number {
  if (segment === undefined || !/^\d+$/.test(segment)) {
    throw new HttpError(400, `Invalid id: ${segment}`);
  }

  return Number(segment);
}

async function readValidBody<T>(
  request: IncomingMessage,
  guard: Guard<T>,
): Promise<T> {
  const body: unknown = await getBodyObject(request);
  if (!guard(body)) {
    throw new HttpError(
      400,
      `Validation failed for the submitted data: ${JSON.stringify(body)}`,
    );
  }

  return body;
}

function throwMethodNotAllowed(request: IncomingMessage): never {
  throw new HttpError(
    405,
    `Method ${request.method} not allowed on ${request.url}`,
  );
}
