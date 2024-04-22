---
sidebar_position: 5
---

# User flow mode (e2e)

## Background

The origin Lab module is only geared towards first screen performance and cannot test user interoperability.

When doing performance analysis, some user interaction performance metrics can only be measured manually using chrome devtool, so a way to automatically measure page interaction performance and quantify it into performance metrics is needed.

## Features

- Support for running user-supplied Puppeteer scripts to test page functionality and user interaction performance.
- Integrated [Lighthouse User Flow](https://web.dev/lighthouse-user-flows/) feature to measure performance metrics and provide best practice recommendations.
- Focuses on performance analysis, providing performance analysis tools such as Flame Chart, Treemap, Lighthouse and more.
- Combined with the Source feature, it locates performance issues to the source code location.

## Getting Started

### Step 0: Add configuration

Follow the steps in [Getting Started](./get-started) to edit Profiles, Environments and Pages.

### Step 1: Enable userflow mode on a page

Navigating to **Project→Settings→Pages**.
Click the `User Flow Mode` checkbox on the page settings.

![enable-userflow](/settings/enable-userflow.png)

### Step 2: Write User Flow Scripts (Or record using Chrome Devtools)

This platform uses [puppeteer](https://github.com/puppeteer/puppeteer) to run user flows. The scripts are compatible with most common puppeteer APIs.

#### Scripts running environments

A Puppeteer instance is created in advance of running the user flow script, open the browser, create a tab, and the Profiles and Environments configured on the platform are automatically injected into the browser tab. The tab is injected into the script environment global variable `page`. **The user flow script only needs to call the methods on `page` to operate it**. See [puppeteer class-page API](https://pptr.dev/api/puppeteer.page) for more methods.

#### Example

```javascript
await page.goto('https://a.b.c/')

// Click on the div with the classname ms-list-cell and containing appmonitor/main

const [project] = await page.$x("//div[contains(@class, 'ms-List-cell') and contains(., 'appmonitor/main')]")

await project.click()

// wait for redirection

await page.waitForNetworkIdle()
```

#### Record using Chrome Devtools

A more convenient way is to use Chrome Devtools to record the script.

1. Open the target page on your chrome and open the devltoos.
2. Click the `Recorder` tab and create a new recording.
   ![Recorder](/lab/chrome-recorder.png)
3. Click the `Start recording` button and do your interactions on the target page.
4. After recording is finished, click the show code button on the right and switch the script to `Puppeteer`.
   ![recorded-script](/lab/recorded-script.png)
5. Copy the code to the `user flow scrtip` editor directly.

#### User Flow

In order to analyze the performance metrics of user actions at runtime, such as time spent per redirect, response time per click, etc., we divide the entire script into Steps, each of which generates performance metrics.

A Step is automatically started when the following actions are triggered in the script.

- goto
- reload
- goBack
- goForward
- click
- focus
- hover
- select
- tap
- type
- All methods of class Mouse
- All methods of class Touchscreen
- All methods of class Keyboard
- drag&drop of class ElementHandle

If you want to combine multiple actions into one Step, such as mouse press, move, and then release to simulate a drag operation, you need to use the `startStep` and `endStep` methods on the global object `flow`.

Example:

```javascript
await flow.startStep('<Step Name>')

await page.mouse.down()
await page.mouse.move(0, 100)
await page.mouse.move(100, 100)
await page.mouse.move(100, 0)
await page.mouse.move(0, 0)
await page.mouse.up()

await flow.endStep()
```

**page.goto is a special Step that should not be called between `flow.startStep` and `flow.endStep`.**

### Step 3: Take an Userflow Snapshot manually

Navigate to **Project→Lab** and click the `Take a snapshot` button at the top right of the page to select the user flow page you want to test to trigger a scan.

### Step 4: View the result

Clicking on the Snapshot card in the Lab module will display all the results of this run and click the page name to go to the report you want to view.

![snapshot detail](/lab/e2e-take-snapshot-detail.png)

#### User Flow Report

In the report you can see the performance analysis data and optimization recommendations for each step. Click on the thumbnail on the timeline to jump to the next step.

![userflow](/lab/e2e-report-userflow.png)
