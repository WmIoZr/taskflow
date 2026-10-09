export function parseArgs(args) {

    if (!Array.isArray(args)) throw new Error('Incorrect argument was passed to parse');

    const argsWithoutPaths = args.slice(2);
    const result = {};

    if (argsWithoutPaths.length === 0) 
        throw new Error('No command given. Expected add/list/done/delete/stats');

    if (argsWithoutPaths[0].startsWith('--'))
        throw new Error(`Expected command, got ${argsWithoutPaths[0]} option`);

    result.command = argsWithoutPaths[0];
    result.positional = [];
    result.options = {};

    for (let i = 1; i < argsWithoutPaths.length; i++) {

        const currentArg = argsWithoutPaths[i];

        if (currentArg.startsWith('--')) {

            if (argsWithoutPaths.length <= i + 1
                || argsWithoutPaths[i + 1].startsWith('--')) 

                throw new Error(`Option ${currentArg} needs a value`);

            result.options[currentArg.slice(2)] = argsWithoutPaths[++i];

        } else {

            result.positional.push(currentArg);
        }
    }

    return result;
}