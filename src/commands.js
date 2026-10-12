import { loadData, saveData } from "./storage.js";
import { createTask, STATUSES, PRIORITIES } from "./task.js";

export async function executeCommand(parsedArgs) {
  switch (parsedArgs.command) {
    case "add": {
      const createdTask = await applyAdd(parsedArgs);

      return `Task #${createdTask.id} is created!`;
    }

    case "delete": {
      return deleteById(parsedArgs.positional);
    }

    case "list": {
      return listTasks(parsedArgs);
    }

    case "done": {
      return setDoneById(parsedArgs.positional);
    }

    case "stats": {
      return provideStats();
    }

    default: {
      throw new Error(`Unknown command: ${parsedArgs.command}`);
    }
  }
}

async function provideStats() {
  const data = await loadData();
  const tasks = data.tasks;

  if (tasks.length === 0) {
    return "No tasks to show stats";
  }

  return getTaskStatusStats(tasks) + getOverdueStats(tasks);
}

function getOverdueStats(tasks) {
  const localDateString = getLocalDateString();
  const overdueTasks = tasks.filter((task) => {
    if (task.due === null || task.status === "done") return false;
    return task.due < localDateString;
  });

  let resultString = "";

  if (overdueTasks.length === 0) {
    resultString += "No tasks are overdue. Good for you!\n";
  } else {
    resultString += `Overdue tasks count: ${overdueTasks.length}. Specifically:\n`;

    for (const overdueTask of overdueTasks) {
      resultString +=
        `Task #${overdueTask.id} (${overdueTask.name}, ` +
        `with ${overdueTask.priority} priority, due: ${overdueTask.due}) is overdue\n`;
    }
  }

  return resultString;
}

function getTaskStatusStats(tasks) {
  const initialStats = {};

  STATUSES.forEach((value) => (initialStats[value] = 0));
  const taskStatusCount = tasks.reduce((prev, curr) => {
    prev[curr.status]++;
    return prev;
  }, initialStats);

  let resultString = "";

  for (const status in taskStatusCount) {
    resultString += `Tasks with status ${status} - ${taskStatusCount[status]}\n`;
  }

  return resultString;
}

function getLocalDateString() {
  const currentDate = new Date();

  return (
    `${currentDate.getFullYear()}-` +
    `${String(currentDate.getMonth() + 1).padStart(2, "0")}-` +
    `${String(currentDate.getDate()).padStart(2, "0")}`
  );
}

async function setDoneById(positionalArgs) {
  const id = checkId(positionalArgs, "done");
  const data = await loadData();

  const taskToUpdate = data.tasks.find((task) => task.id === id);

  if (!taskToUpdate) {
    throw new Error(`Task #${id} not found`);
  }

  if (taskToUpdate.status === "done") {
    return `Task #${id} status was already 'done'`;
  }

  taskToUpdate.status = "done";

  await saveData(data);

  return `Task #${id} status set to 'done'`;
}

async function deleteById(positionalArgs) {
  const id = checkId(positionalArgs, "delete");
  const data = await loadData();

  const deleteIdx = data.tasks.findIndex((task) => task.id === id);

  if (deleteIdx === -1) {
    throw new Error(`Task #${id} not found`);
  }

  data.tasks.splice(deleteIdx, 1);

  await saveData(data);

  return `Task #${id} deleted.`;
}

function checkId(positionalArgs, command) {
  if (positionalArgs.length !== 1) {
    throw new Error(`Expected exactly one task id, e.g. ${command} 3`);
  }

  const id = +positionalArgs[0];

  if (!Number.isInteger(id)) {
    throw new Error(`Invalid id passed: ${positionalArgs[0]}`);
  }

  return id;
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
