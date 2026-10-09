import { loadData, saveData } from "./storage.js";
import { createTask } from "./task.js";

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
      break;
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
