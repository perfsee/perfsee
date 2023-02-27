---
title: Get Started
---

## Create Project

All Perfsee features are used in the context of a project. One or more projects can be created for a single repository, depending on how your repository is organized, like in the form of monorepo. So the first step is to create a project. You can create a project manually or import it from GitHub.

### Create Project Manually

After you enter the [project list page](https://perfsee.com/projects), you can click the **Create Project** button on the top right of the page, select the corresponding repository hosting platform, and enter the repository's namespace and name to create it.

### Import Project from GitHub

Click the **Import from GitHub** button on the top right of the page. Associate your GitHub account, follow the guide to select the GitHub project you want to import and complete the creation.

:::note
If you cannot find the GitHub user or organization you want to import during the progress, please install our [GitHub Application](https://github.com/apps/Perfsee/installations/new) to your GitHub account first.
:::

![import-project](/import-project.png)

## Usage

After creating the project, we can analyze the performance of our code repository and site. The main modules that need to be configured are as follows:

### Bundle Analysis

As we all know, most front-end projects are bundled by build tools, and the size of the bundle are important factors that affect performance. So we provide analysis plugins for various bundle tools to help us quickly analyze and optimize your project.

For more details, please refer to [Bundle Analysis](./bundle/get-started.md).

### Lab Analysis

Lab analysis refers to the performance analysis of the application at runtime, including page performance, resource loading performance, error monitoring, etc. We provide runtime analysis plugins for various front-end frameworks to help us quickly analyze and optimize runtime performance.

For more details, please refer to [Lab Analysis](./lab/get-started.md).

### Source Analysis

The source analysis feature is used to locate the source code location of the performance issue. It is automatically enabled after the bundle analysis and runtime analysis and does not require additional configuration. But to consume the results of the source analysis, you need to correctly install our editor plugin.

For more details, please refer to [Source Analysis](./source/get-started.md).
