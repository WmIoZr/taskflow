import { parseArgs } from "./parser/parser.js";

try {
    console.log(parseArgs(process.argv));
} catch (err) {
    console.error(err.message)
}