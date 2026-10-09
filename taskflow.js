import { parseArgs } from "./src/parser.js";

try {
    console.log(parseArgs(process.argv));
} catch (err) {
    console.error(err.message)
}