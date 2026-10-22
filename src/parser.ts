type Options = Record<string, string>;

export interface ParsedArgs {
  command: string;
  positional: Array<string>;
  options: Options;
}

export function parseArgs(args: Array<string>): ParsedArgs {
  const argsWithoutPaths = args.slice(2);
  const command = argsWithoutPaths[0];

  if (command === undefined) {
    throw new Error("No command given. Expected add/list/done/delete/stats");
  }
  if (command.startsWith("--")) {
    throw new Error(`Expected command, got ${command} option`);
  }

  const positional: Array<string> = [];
  const options: Options = {};

  for (let i = 1; i < argsWithoutPaths.length; i++) {
    const currentArg = argsWithoutPaths[i]!;
    const nextArg = argsWithoutPaths[i + 1];

    if (currentArg.startsWith("--")) {
      if (nextArg === undefined || nextArg.startsWith("--"))
        throw new Error(`Option ${currentArg} needs a value`);

      options[currentArg.slice(2)] = nextArg;
      i++;
    } else {
      positional.push(currentArg);
    }
  }
  return { command, positional, options };
}
