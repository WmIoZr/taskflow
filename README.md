# TaskFlow

Task tracker (internship project): a CLI and a REST API on bare `node:http`, written in TypeScript.

## Setup

Requires Node.js 24.

```
npm install
```

## REST API

Start the server (restarts on file changes):

```
npm run dev
```

It listens on `http://localhost:3000`.

Projects:

- `GET /projects`, `POST /projects`
- `GET /projects/:id`, `PATCH /projects/:id`, `DELETE /projects/:id` (409 if the project still has tasks)

Tasks:

- `GET /tasks`, with optional filters `?status=todo|in_progress|done` and `?priority=low|medium|high`
- `POST /tasks` (`name` and `projectId` required; `priority` defaults to medium, `due` is optional, YYYY-MM-DD)
- `GET /tasks/:id`, `PATCH /tasks/:id`, `DELETE /tasks/:id`

Responses are JSON. Status codes: 200, 201 (created), 204 (deleted), 400 (invalid input), 404 (not found), 405 (method not allowed), 409 (conflict), 500 (logged server error).

### Postman

`postman/taskflow.postman_collection.json` contains every endpoint, including the error cases, with tests. Import it in Postman, start the server, and run the whole collection in order: later requests use ids saved by earlier ones.

## CLI

```
npx tsx src/taskflow.ts <command>
```

Commands:

- `add <name> --project <id> [--priority low|medium|high] [--due YYYY-MM-DD]`: create a task in an existing project (priority defaults to medium)
- `list [--status todo|in_progress|done] [--priority low|medium|high]`: show tasks, newest first
- `done <id>`: mark a task as done
- `delete <id>`: delete a task
- `stats`: count tasks per status and list overdue ones

The CLI can't create projects: create them through the API first.

## Data

Stored in `data/tasks.json` and `data/projects.json`, created on first use. The CLI and the server share them.

## Development

- `npm run check`: type-check without building
- `npm run build`: compile to `dist/`, then run `node dist/server.js` or `node dist/taskflow.js <command>`
- `npm run start`: starts the server after the app was compiled into `dist/`

## What was tough

### Week 1:

- Creating Set requires iterable to be passed, and only the first one is considered, iterated and creates Set;
- Dates work differently depending on what is passed or which method is called. "2026-10-20" is parsed as UTC, while other formats are parsed as local time. new Date("garbage") doesn't throw, it returns an Invalid Date. getDay() is the day of the week, not the day of the month;
- Expected splice(-1, 1) to throw, but instead deleted the last element;
- reduce() should return accumulator for the next iteration, not modified property (just forgot about it).

All those were resolved by reading manual and asking AI.

### Week 2:

- noUncheckedIndexedAccess being stupid. Iterating through array with index in bounds of length forces to either use array[index]!.doSmth() or check for undefined;
- string is not always applicable where union of strings is required. I'm facing it again and again. Union is just narrower type. Guard is needed. But in other direction, Set of literals can't check the string value. The issue comes from co- and contravariance relations. To make collection of literal strings applicable to strings overall, you should make it covariant through read only alternatives;
- TS can't always see obvious stuff, e.g. object of Omit<T, "id"> plus an id property does not equal exactly T for TS, so I validate the merged object with the type guard instead of using "as T";
- Writing type predicate to each dedicated type is required to be done fully manually, going through all the fields, and it's not checked by the compiler. Updating interface implies we remember to update predicate's body;
- Request bare parsing takes a lot of time (splitting path, extracting values, combining and validating body), and it's really repetitive;
- Types don't exist in the runtime, so you should make sure that you are truly updating object with only required field. JSON.parse() returns any, should be treated as unknown and type checked.

Resolved the same way as week's 1 issues.
