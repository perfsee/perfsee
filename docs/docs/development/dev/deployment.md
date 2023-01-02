---
sidebar_position: 4
---

# Deployment

## Frontend

### Bundle

For the Perfsee frontend project, we need to use Webpack to bundle the code, and the bundled code will be output to the `./assets/platform` directory. Then you can decide whether to upload it to CDN or use the backend server to serve those assets.

```bash
# Note: production build assets need to set NODE_ENV=production
export NODE_ENV=production

yarn cli bundle -p @perfsee/platform
```

### CDN

If you chose to use a CDN service to distribute static assets, you can specify the CDN path prefix by setting the `PUBLIC_PATH` environment variable.

```bash
export PUBLIC_PATH=https://your.cdn/perfsee/assets

yarn cli bundle -p @perfsee/platform
```

### API Service

If you have a service API with a different domain name from the front end, such as using `https://api.perfsee.com` to provide API services, you can specify the API service address by setting the `SERVER` environment variable.

```bash
export SERVER=https://api.perfsee.com

yarn cli bundle -p @perfsee/platform
```

## Backend

### Machine Resource Requirements

The backend service has a small dependency on resources.

|     | Specification  |
| --- | -------------- |
| Min | 2 cores 4G Mem |
| Rec | 4 cores 8G Mem |

### Compile

To deploy the backend service, we don't need to bundle the source code like the frontend project, but because the source code is written in TypeScript, we need to compile it to JavaScript first so that Node.js can start normally.

```bash
# Compile
yarn build:ts
```

### Environment Variables

At runtime, environment variables are often very important, they directly affect the behavior of the backend service. So before deployment, we need to set up these environment variables first.

Perfsee supports using the `.env` mode to conveniently set common environment variables. We only need to copy the `./packages/platform-server/.env.example` file and rename it to `.env`, then modify the configuration according to our needs. These configurations will affect the behavior of the backend service at runtime.

Of course, you can also set the environment variables in the appropriate place according to your service provider, so you don't need to modify or even create the `.env` file.

```bash
# Set .env
cp ./packages/platform-server/.env.example ./packages/platform-server/.env
```

### Start Service

Since the project code uses the reference path alias capability provided by TypeScript, such as `@perfsee/shared => ./packages/shared/src/index.ts`, we need to use the `paths-register` tool provided in tools to register these aliases before starting the service, so that Node.js can correctly resolve these referenced paths.

```bash
node -r ./tools/paths-register ./packages/platform-server/dist/index.js
```

### Serve frontend assets

One last thing, if you want to use the backend service to serve the frontend assets, then before starting the backend service, you should use the deployment method described in the frontend section to bundle the frontend code, and the assets will automatically be put under `./assets/platform` folder. The backend service will automatically find these assets through the relative path and serve them after started.

## Runner

### Machine Resource Requirements

Since the Runner will start a headless chromium browser on the machine to analyze the user's page, it has a very large dependency on the specifications and stability of the machine.

:::caution
Please make sure that the machine deployed with Runner can meet the minimum requirements below, and will not be dynamically scaled down and resource recycled, otherwise it will greatly affect the stability of the analysis task.

By the way, The Runner process requires Chromium to be installed on the machine or container. You can check out the install guide [here](https://www.chromium.org/getting-involved/download-chromium).
:::

|     | Specification  |
| --- | -------------- |
| Min | 4 cores 8G Mem |

### Get Registration Token

Before deploying the Runner, we first need to know that the Runner depends on the backend service, so before deployment, we need to make sure that the backend service has been deployed correctly and can be accessed by the machine where the Runner will be deployed. The Runner will register itself with the backend service after startup, get the task, then execute the task, and finally report the result to the backend service. The registration process requires a registration token, which needs to be obtained by the administrator on the [admin page](https://where.server.deployed/admin/runners) of the backend service.

### Deployment

```bash
# Need to compile typescript
yarn build:ts

# Tell the Runner the address of the backend service it needs to communicate with
export PERFSEE_PLATFORM_HOST=https://where.server.deployed
# The registration token required to register the Job Runner in the previous section
export PERFSEE_REGISTRATION_TOKEN=YOUR_REGISTRATION_TOKEN

# Start the Runner
node -r ./tools/paths-register ./packages/runner/executor/dist/index.js
```

### Release Runner Scripts

The Runner needs to pull the corresponding analysis logic from the backend service before executing the analysis jobs, and this analysis logic is called Runner Script. The implementation logic of Runner Scripts is stored in the `./packages/runner` directory.
Administrators can view and manage the Runner Scripts version currently used by the Runner on the [admin page](https://where.server.deployed/admin/runner-scripts).

Every time the Runner gets a new analysis job, it first queries the backend service to see if the Runner Script version corresponding to the job type is consistent with the local cache. If there is a new version, the Runner will start executing the analysis logic after downloading and verifying it. The version of Runner Script is consistent with the package version corresponding to the release, so before releasing, you need to update the version number through the `yarn release` command to avoid version number conflicts.

You can use the script provided by us to release the Runner Scripts.

:::caution
To avoid errors in the online environment, the newly released Runner Scripts will not be enabled by default. You need to enable it through the [admin page](https://where.server.deployed/admin/runner-scripts) after verification.
:::

```bash
// Backend service address
export PERFSEE_PLATFORM_HOST=https://where.server.deployed
// The same token as one used to register the Runner, which can be obtained from the admin page
export PERFSEE_REGISTRATION_TOKEN=YOUR_REGISTRATION_TOKEN
yarn cli upload-scripts
```

## Deployed in subpath

In the ideal case, we usually have the ability to deploy the Perfsee service with a separate domain name, such as `perfsee.com`. But in the actual production environment, we may not have the resources to apply for an additional domain name, so we need to deploy multiple services under a domain name, at this time we need to use subpaths to distinguish different services.

The Perfsee code repository provides an out-of-the-box subpath deployment solution. You only need to set the `SUB_PATH` environment variable before packaging the front-end assets, and then set the `PERFSEE_SERVER_SUB_PATH` environment variable when deploying the backend service to deploy the Perfsee service under the subpath.

```bash
# Package the front-end assets
# For example, deploy the service under https://your.domain/perfsee
export SUB_PATH=/perfsee

# Generate relative scaffold code for the new subpath
yarn codegen

yarn cli bundle -p @perfsee/platform
```

```bash
# Deploy the backend service
export PERFSEE_SERVER_HOST=your.domain
export PERFSEE_SERVER_SUB_PATH=/perfsee

node -r ./tools/paths-register ./packages/platform-server/dist/index.js
```
