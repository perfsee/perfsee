# Group View

As the demand for cross-project queries increases, the platform has launched a group view feature that allows viewing performance overview from multiple project perspectives.

## Create Group

After entering the platform, click the [Create Group] button at the top right of the home page, enter the global unique custom group id, and select 1 to 8 projects with access rights to create.

![img](/group/create-group.png)

## Metrics

### Home

| Name            | Description                                                                                                                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project         | Project ID, you can click to enter the project home page.                                                                                                                                                  |
| Lab score       | Average of the performance scores of all successfully scanned lab reports for the time period.                                                                                                             |
| Bundle score    | Average of the scores of all successfully scanned bundle reports for the time period.                                                                                                                      |
| Bundle size     | The value displayed is the average of all entrypoints for the latest bundle report that was successfully scanned and is baseline for that time period, compared to the oldest report for that time period. |
| Initial JS Size | The value displayed is the average of all entrypoints for the latest report that was successfully scanned and is baseline for that time period, compared to the oldest report for that time period.        |
| FCP 等关键指标  | The value displayed is the average of the corresponding metrics from the reports in latest snapshot for that time period. Compared with the oldest record.                                                 |
| Job duration    | Job duration for that time period.（i.e. Bundle / Lab / Source job）                                                                                                                                       |
| Storage         | Job storage for that time period.                                                                                                                                                                          |
| Job count       | Job count for that time period.                                                                                                                                                                            |

![img](/group/home.png)

### Analysis

![img](/group/analysis.png)

#### Bundle Size History

The data is from the bundle reports that was successfully scanned and is baseline for that time period. the legend is group by 'projectName-entrypoint', You can click legends to toggle displaying series in the chart.

#### Bundle Score History

The data is from the bundle reports that was successfully scanned and is baseline for that time period. the legend is group by 'projectName-entrypoint', You can click legends to toggle displaying series in the chart.

### Settings

:::info
Only project owner has permission to modify settings
:::

![img](/group/settings.png)
