---
sidebar_position: 4
---

# How to use the competitor analysis

By comparing site performance with competitor performance, you can understand the performance bottlenecks of your site compared with competitor products.

Including the comparison of performance score, critical metrics, the number of requests, etc., so that you can optimize your site.

The Competitor function is based on the basic capabilities of the Lab Module, if you want to know more details, click: [The Detail of Snapshot Report](./report)

## Getting Started

### 1. Add a competitor environment

Navigate to **Settings->Environments**,
Click the `Create environment` button in the upper right corner and check the checkbox to create a competing environment. The environment is used to set cookies and headers for competitor pages and temporary pages.

![competitor environment](/settings/environment-competitor.png)

### 2. Add a competitor page

Navigate to **Settings->Pages**,

![create competitor page](/settings/create-competitor-page.png)

1. Click `Create a Competitor Page`
2. The competitor page can only be associated with the competitor environment.
3. Associate the competitor page with the site page to be compared. [It will only appear when you create a new one. If you need to modify the associated page or cancel the association subsequently, you need to go to the corresponding site page to edit it.]

### 3. Take a snapshot manually

Navigate to **Project→Lab** and click the `Take a snapshot` button at the top right of the page to select the page you just associated with a competitor page to trigger a scan.

![take snapshot](/lab/take-snapshot.png)

![take snapshot detail](/lab/take-snapshot-detail.png)

### 4. View the competitor overview result

Navigate to **Project→Competitor**.

![competitor](/lab/competitor.png)

1. The three selectors in the upper left corner allow you to switch data based on profile/page/environment.
2. you can choose the time span you want to analyze, the default is 15 days.
3. Click `Competitor Report` to enter a more detailed performance analysis comparison report, in which the report uses the **latest** data within the time span selected by the time selector for comparison.
4. All scores in the table are the average of all valid data in the time span, and the percentages after ± refer to the relative margin of error, which is calculated by dividing the margin of error of all samples by the average, expressing the magnitude of random fluctuations in the statistical results.
5. Select the data metric to be analyzed to see the trend of the corresponding metric, which defaults to the Lighthouse Performance Score.

### 5. View the competitor detailed result

#### Overview

Lists some attributes and metrics of site pages compared to competitor pages. Green indicates better performance.

![detail 0](/lab/competitor-detail-0.png)

![detail 1](/lab/competitor-detail-1.png)

#### Breakdown

![detail 2](/lab/competitor-detail-2.png)
