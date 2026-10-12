import { parseArgs } from "./src/parser.js";
import { executeCommand } from "./src/commands.js";

try {
  console.log(await executeCommand(parseArgs(process.argv)));
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}
