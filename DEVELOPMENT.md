# Development Guide

Hi! We are really excited that you are interested in contributing to Perfsee.
Before submitting your contribution, please make sure to take a moment and read through the following guide:

## Setup

### install dependencies

We currently use `yarn` to manage node modules so you need to have it installed before starting.
Check out the [yarn installation guide](https://yarnpkg.com/en/docs/install) for more information if you didn't.

```bash
yarn
```

### Codegen

After installation, there is some codegen work as well.

In this step, the required files will be generated to make sure typecheck and linter work correctly. You can run the command easily by:

```bash
yarn codegen
```

## Start dev server

### Docker compose

If you prefer useing docker compose to setup your development environment, we have already preconfigured it for you, so what your need to do is just bringing compose up:

```bash
# since docker compose v2 will not follow `depends_on` order when building images, you should build develop image separately.
# see https://github.com/docker/compose/issues/9686
docker-compose build
docker-compose up
```

then the server will be started and you can visit the dev server at `http://localhost:8080`.

### Manually start

> Mysql and Redis services are required.

Perfsee consists of multiple components/services, the most used are:

- [server](./packages/platform-server): main backend service
- [frontend](./packages/platform): the frontend code
- [job-runner](./packages/job-runner): the job runner service

You could start them separately as you need:

```bash
# start the backend service, default listen port is 3000
yarn dev -p @perfsee/platform-server

# start the frontend service, default listen port is 8080
yarn dev -p @perfsee/platform

# start the job runner service, no listening port, rely on the backend service
yarn dev -p @perfsee/job-runner
```

or you can omit the `-p` argument and a prompt will be shown to let you select available service to start.

```bash
yarn dev

# output
🐒 Choose a project to dev: (Use arrow keys)
❯ @perfsee/platform
  @perfsee/platform-server
  @perfsee/job-runner
```

## Testing

The testing framework we chose is [`ava`](https://github.com/avajs/ava). Checkout the its docs for writing tests with it.

All tests should be put under `__tests__` folder near the components or functions to be tested, and name them with `.spec.ts` or `.spec.e2e.ts` suffix for convenience.

> The `.spec.e2e.ts` or `.spec.serial.ts` suffix should be used with tests that would have unexpected side effects if running parallel, like reading/writing database.

```bash
# running all testcases
yarn test

# running only `.spec.ts` testcases
yarn ava

# running only `.spec.{e2e,serial}.ts` testcases
yarn ava -s
```

## Code style

We use [`ESLint`](./.eslintrc.js) and [`Prettier`](./package.json) to enforce code style:

```bash
yarn lint
```

And also `TypeScript` for strongly type check:

```bash
yarn typecheck
```

## Commit

A commitlint is setup as well so all commit messages will be checked.
Check out the [commitlint](https://github.com/conventional-changelog/commitlint) for more detail.

In general, all commit message should be in the following format:

```
type(scope?): subject
```

The `type` field depends on what the commit does, like `feat` for adding new feature, `fix` for fixing bug, `ci` for CI related changes, etc. You can find the full list at [commitlint](https://github.com/conventional-changelog/commitlint).

The `scope` should be folder name of each package, and the `subject` should be a short but clear description of the commit.

Here are some real world examples:

```
feat(platform): add a retry button on failed job
fix(job-runner): random panic when spawning workers
chore: bump up dependencies
```

We highly recommend one commit for just doing one thing. Do not including several stuff in one commit.

## Versioning

We could easily generate changelog and tag our packages thanks to `conventional-changelog` with understandable commits messages.

```bash
yarn release
```

## Deployment

### Frontend

The frontend code output path is set `./assets/platform`, you can decide to upload them to CDN or serve them as static depending on your preference.

If you prefer uploading them to CDN, you could build the frontend part with `PUBLIC_PATH` environment variable set to the CDN url prefix:

```bash
export PUBLIC_PATH=https://you.cdn/perfsee/prefix
yarn cli bundle -p @perfsee/platform
```

### Backend

```bash
# build typescript
yarn build:ts

# setup .env
cp ./packages/platform-server/.env.example ./packages/platform-server/.env

# start node server
# paths-register is used to alias packages in workspace
node -r ./tools/paths-register ./packages/platform-server/dist/index.js
```

### Job Runner

> Job Runner service denpend on the backend service to register itself and fetch jobs.
> So you must have backend service deployed first.

```bash
yarn build:ts

export PERFSEE_PLATFORM_HOST=https://where.server.deployed
# Admin users could get the registration token on runner management page
export PERFSEE_REGISTRATION_TOKEN=YOUR REGISTRATION TOKEN
node -r ./tools/paths-register ./packages/job-runner/dist/index.js
```
