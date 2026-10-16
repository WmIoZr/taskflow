# TaskFlow

CLI task tracker (internship project).

## Usage

Requires Node.js 24.

```
npm install
npx tsx src/taskflow.ts <command>
```

Commands:

- `add <name> [--priority low|medium|high] [--due YYYY-MM-DD]`: create a task (priority defaults to medium)
- `list [--status todo|in_progress|done] [--priority low|medium|high]`: show tasks, newest first
- `done <id>`: mark a task as done
- `delete <id>`: delete a task
- `stats`: count tasks per status and list overdue ones

Tasks are stored in `data/tasks.json` (created on first use).

Development:

- `npm run check`: type-check without building
- `npm run build`: compile to `dist/`, then run with `node dist/taskflow.js <command>`

## What was tough

### Week 1:

- Creating Set requires iterable to be passed, and only the first one is considered, iterated and creates Set;
- Dates work differently depending on what is passed or which method is called. "2026-10-20" is parsed as UTC, while other formats are parsed as local time. new Date("garbage") doesn't throw, it returns an Invalid Date. getDay() is the day of the week, not the day of the month;
- Expected splice(-1, 1) to throw, but instead deleted the last element;
- reduce() should return accumulator for the next iteration, not modified property (just forgot about it).

All those were resolved by reading manual and asking AI.

### Week 2:

- noUncheckedIndexedAccess being stupid. Iterating through array with index in bounds of length forces to either use array[index]!.doSmth() or check for undefined;
- string is not always applicable where union of strings is required. I'm facing it again and again;
- TS can't always see obvious stuff, e.g. object of Omit<T, "id"> plus an id property does not equal exactly T for TS, so I validate the merged object with the type guard instead of using "as T";
- Writing type predicate to each dedicated type is required to be done fully manually, going through all the fields, and it's not checked by the compiler. Updating interface implies we remember to update predicate's body.

Resolved the same way as week's 1 issues.
