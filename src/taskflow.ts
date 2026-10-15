import { parseArgs } from "./parser.js";
import { executeCommand } from "./commands.js";
import { getErrorMessage } from "./errors.js";

try {
  console.log(await executeCommand(parseArgs(process.argv)));
} catch (err) {
  console.error(getErrorMessage(err));
  process.exitCode = 1;
}
