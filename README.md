# TaskFlow

Task tracker (internship project): a REST API built with NestJS, PostgreSQL and Prisma, in `api/`. Users register and log in with JWT; only members of a project can change its tasks and comments.

## Setup

### Prerequisites

Node.js 20.19+ or 22.12+ and Docker Desktop.

### Steps

1. Clone the repository and enter the API folder:

   ```powershell
   git clone https://github.com/WmIoZr/taskflow
   cd taskflow/api
   ```

2. Install dependencies:

   ```powershell
   npm ci
   ```

3. Create `.env` from `.env.example` and fill in your local values. `DB_PASSWORD` must match the password inside `DATABASE_URL`:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Start the database:

   ```powershell
   docker compose up -d --wait
   ```

5. Apply migrations:

   ```powershell
   npx prisma migrate deploy
   ```

6. Generate the client:

   ```powershell
   npx prisma generate
   ```

7. Start the app:

   ```powershell
   npm run start:dev
   ```

   The API is available at http://localhost:3000.

If port 5433 is taken, change `POSTGRES_MACHINE_PORT` and the port in `DATABASE_URL` together.

## Scripts

Run from `api/`:

| Script              | What it does                                           |
| ------------------- | ------------------------------------------------------ |
| `npm run start:dev` | Starts the API and restarts it on file changes         |
| `npm run check`     | Type-checks the project without building               |
| `npm run test`      | Runs the unit tests                                    |
| `npm run test:e2e`  | Runs the end-to-end tests (needs the database running) |

## API documentation

Swagger UI is available at http://localhost:3000/api while the app is running.

Most endpoints need a token: call `POST /auth/register`, then `POST /auth/login`, click **Authorize** and paste the `accessToken` from the login response.

## Testing

- **Unit tests** (`npm run test`) check `TasksService` with its dependencies mocked, without a database.
- **End-to-end test** (`npm run test:e2e`) starts the real app and runs register → login → create project → create task against the database. It uses the development database and deletes what it created.
- **Postman collection**: `api/postman/taskflow.postman_collection.json`. Import it into Postman and run the whole collection with the Collection Runner while the app and database are running. Run it from the start: the Auth folder registers a fresh user and saves the token that every other request uses.

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

### Week 3:

- Recurring problem of missing await and some decorators while implementing Nest components;
- Conflicts of versions: new Nest docs doesn’t describe the simple @nestjs/jwt + guard flow anymore, rather cluttered bunch of most currently used practices (OIDC, email verification, session based authen complitely missing JWT one, etc.), Prisma 8 being AI-centric and completely rewritten from 7.
- Connection to the database in Postgres adapter’s connection pool is lazy. To check it, you should specifically query `SELECT 1`;
- `transform: true` property does work with function parameters, but not in a way one may expect (it will transform query param or path variable to, e.g., number, but it won't throw on 1.5 when you expect integer). So dedicated pipe should be used;
- undefined and null are treated differently by Prisma: first acts as a column absence or no condition in where (allowing not to check if value for filter is defined while quering, NOT UPDATING), second is the same as SQL NULL.

Resolvations are the same as in week 1.
