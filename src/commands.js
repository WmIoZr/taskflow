import { loadData, saveData } from "./storage.js";
import { createTask, STATUSES, PRIORITIES } from "./task.js";

export async function executeCommand(parsedArgs) {
  switch (parsedArgs.command) {
    case "add": {
      const createdTask = await applyAdd(parsedArgs);

      return `Task #${createdTask.id} is created!`;
    }

    case "delete": {
      break;
    }

    case "list": {
      return listTasks(parsedArgs);
    }

    case "done": {
      break;
    }

    case "stats": {
      break;
    }

    default: {
      throw new Error(`Unknown command: ${parsedArgs.command}`);
    }
  }
}

async function listTasks(parsedArgs) {
  const data = await loadData();
  const status = parsedArgs.options.status?.trim().toLowerCase();
  const priority = parsedArgs.options.priority?.trim().toLowerCase();

  let filteredTasks = data.tasks;

  if (status !== undefined) {
    checkValueInSet(status, STATUSES);
    filteredTasks = filteredTasks.filter((task) => task.status === status);
  }

  if (priority !== undefined) {
    checkValueInSet(priority, PRIORITIES);
    filteredTasks = filteredTasks.filter((task) => task.priority === priority);
  }

  return filteredTasks.length > 0
    ? `Tasks:\n${formatTasks(filteredTasks)}`
    : "No tasks found";
}

function formatTasks(tasks) {
  return tasks
    .map(
      (task) =>
        `#${task.id} ${task.name} (priority: ${task.priority}, ` +
        `due: ${task.due ?? "No deadline"}, status: ${task.status})`,
    )
    .join("\n");
}

function checkValueInSet(value, set) {
  if (!set.has(value)) {
    throw new Error(
      `Invalid value passed: ${value}. Expected ${[...set].join(", ")}`,
    );
  }
}

async function applyAdd(parsedArgs) {
  const task = createTask(
    parsedArgs.positional.join(" "),
    parsedArgs.options.priority,
    parsedArgs.options.due,
  );

  return await saveNewTask(task);
}

async function saveNewTask(task) {
  const data = await loadData();

  const newTask = {
    id: data.nextId++,
    ...task,
    createdAt: new Date().toISOString(),
  };

  data.tasks.unshift(newTask);

  await saveData(data);

  return newTask;
}
