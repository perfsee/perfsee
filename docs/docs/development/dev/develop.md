---
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Develop

## Initialization

### Install dependencies

Currently we use `yarn` to manage project dependencies, so you need to install `yarn` correctly before you start.
If you haven't installed `yarn`, you can find detailed installation methods in [yarn installation guide](https://yarnpkg.com/en/docs/install).

```bash title="Install dependencies"
yarn
```

### Code generation

After installing the dependencies, we need to generate some necessary type files so that `test`, `typecheck` and `code style check` can work correctly.

```bash title="Code generation"
yarn codegen
```

## Start development server

### Start development server manually

:::note
If you choose to start the development server manually, you need to refer to the [project architecture](./architecture) section for the following dependencies to be installed correctly and in a usable state:

- [Mysql](https://www.mysql.com/downloads) for storing data
- [Redis](https://redis.io/download) for storing cache
  :::

Perfsee is composed of many components and services, but in the daily development process, the most common ones are these three:

- [Server](https://github.com/perfsee/perfsee/tree/main/packages/platform-server): Main backend service
- [Frontend](https://github.com/perfsee/perfsee/tree/main/packages/platform): Frontend code
- [Job Runner](https://github.com/perfsee/perfsee/tree/main/packages/runner): Analysis task executor service

You can choose the service you need to develop, and then start it independently:

<Tabs>
<TabItem value="Server">

```bash
# Start backend service, default listening to port 3000, access through http://localhost:3000
yarn dev -p @perfsee/platform-server
```

</TabItem>
<TabItem value="Frontend">

```bash
# Start frontend service, default listening to port 8080, access through http://localhost:8080
# Depends on the backend service, all backend requests will be proxied to http://localhost:3000
yarn dev -p @perfsee/platform
```

</TabItem>
<TabItem value="Job Runner">

```bash
# Start job runner service, will not listen to any port
# Depends on the backend service. if you want the job system work properly job service need to be started
yarn dev -p @perfsee/job-runner
```

</TabItem>
</Tabs>

### Docker compose

If you prefer to use tools like Docker to manage the development environment, we have already configured a `docker-compose.yml` file for you, you can easily start the entire development environment without worrying about system dependencies:

```bash title="Docker compose"
# Since docker compose v2 does not follow the `depends_on` dependency relationship to sequentially build images, you need to build all the images you need separately.
# See: https://github.com/docker/compose/issues/9686
docker compose build
docker compose up
```

## Test

We choose [`ava`](https://github.com/avajs/ava) as the test framework. You can refer to its documentation to learn how to write test cases.

All test cases should be placed in the `__tests__` folder next to the component or function being tested, and use `.spec.ts` or `.spec.e2e.ts` as the suffix to facilitate searching.

> If the test case has unpredictable side effects when running in parallel, such as reading and writing databases, then it should use `.spec.e2e.ts` or `.spec.serial.ts` as the suffix, and mark it as a test case that can only be run serially.

```bash
# Run all test cases
yarn test

# Only run test cases with `.spec.ts` suffix
yarn ava

# Only run test cases with `.spec.{e2e,serial}.ts` suffix
yarn ava -s
```

## Code style

We use [`ESLint`](./.eslintrc.js) and [`Prettier`](./package.json) to enforce code style:

```bash
yarn lint
```

And use [`TypeScript`](./tsconfig.json) to perform strong type checking:

```bash
yarn typecheck
```

## Commit

We use [`commitlint`](https://github.com/conventional-changelog/commitlint) to enforce commit message format, please refer to its documentation for details.

In general, all commit messages should follow the following format:

```
type(scope?): subject
```

`type` depends on the content of the commit, such as `feat` for adding new features, `fix` for fixing bugs, `ci` for CI related changes, etc. You can find a complete list in [commitlint](https://github.com/conventional-changelog/commitlint).

`scope` can be a package name or a folder name, used to summarize the package involved in the commit.

`subject` is a short description of the commit content.

Here are some real world examples:

```
feat(platform): add a retry button on failed job
fix(job-runner): random panic when spawning workers
chore: bump up dependencies
```

> We strongly recommend that each commit only includes the changes of on simple thing, and do not mix unrelated modifications together.

## Versioning

Thanks to `conventional-changelog`, we can easily generate changelogs and select appropriate version numbers for the next package release based on readable commit messages.

```bash
yarn release
```

## Deployment

Since the deployment progress are quite complicated, we will describe in detail how to deploy the Perfsee to the production environment in a separate [deployment document](../deployment).
