---
sidebar_position: 7
---

# Metrics gallery

# Overview

The doc introduces all the performance metrics that lab module analysis will produce.

You will learn how these metrics are calculated and what will affect these metrics.

## Paint

Metrics related to visual experience when page loading.

| Metric                         | Description                                                                                                     |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| First Contentful Paint (FCP)   | The time at which the browser rendered any text, image, non-white canvas or SVG content.                        |
| Largest Contentful Paint (LCP) | The time at which the the largest image, video or text element was painted to the screen.                       |
| Cumulative Layout Shift (CLS)  | The sum of scores from all of the unstable elements that move around during page load.                          |
| First Paint                    | The time at which the first page paint event occurred.                                                          |
| Speed Index (SI)               | A timing metric that is calculated by analysing the time that the majority of the user’s viewport has rendered. |
| Visually Complete              | A timing metric that is calculated by analysing the time that the user’s viewport has fully rendered.           |

## Runtime

JavaScript execution and page rendering effectiveness.

| Metric                          | Description                                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Time to Interactive (TTI)       | The moment at which the main thread has had 5 seconds with no network activity or JavaScript long tasks. |
| Total Blocking Time (TBT)       | The total duration of Main thread tasks observed between First Contentful Paint and Time to Interactive. |
| JS Parse & Compile              | The duration of the time taken to parse, compile and execute all JavaScript for a page.                  |
| Max Potential First Input Delay | The duration of the worst-case scenario time taken to respond to a user interaction.                     |

## Lighthouse Scores

Lighthouse scores range from 0 to 100. Each metric refers to categorized audits and is calculated using a weighted average.

| Metric               | Description                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Performance Score    | A number ranging from 0 to 100 evaluating the observed speed characteristics of a given page.                      |
| Accessibility Score  | A number ranging from 0 to 100 evaluating the accessibility properties of a given page.                            |
| SEO Score            | A number ranging from 0 to 100 evaluating the SEO potential of a page from pre-defined audits.                     |
| Best Practices Score | A number ranging from 0 to 100 evaluating the implementation of a given page in relation to common best practices. |
| PWA Score            | A number ranging from 0 to 100 evaluating if a page meets the Progressive Web App definition guidelines.           |

## Request

Request metrics relate to the transfer of HTML, Images, JavaScript, CSS, Font, JSON and Video assets. Each asset type is categorized by mime-type analysis.

| Metric                           | Description                                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Time to First Byte (TTFB)        | The time taken from the request being made until the first byte arriving back to the browser.        |
| Response time                    | TTFB plus the time taken for the entire request to be transferred from the server to the client.     |
| Total Page Transferred           | The total file size of all page assets transferred during the page load.                             |
| Total JavaScript Transferred     | The total file size of JavaScript assets transferred during the page load.                           |
| Number of requests (Asset Count) | The total number of requests.                                                                        |
| Total HTML Transferred           | The total file size of HTML assets transferred during the page load.                                 |
| Total Image Transferred          | The total file size of Image (JPEG, PNG, GIF, Webp and SVG) assets transferred during the page load. |
| Total CSS Transferred            | The total file size of CSS assets transferred during the page load.                                  |
| Total Font Transferred           | The total file size of Font (EOT, TTF, WOFF and WOFF2) assets transferred during the page load.      |
| Total JSON Transferred           | The total file size of JSON assets transferred during the page load.                                 |
| Total Video Transferred          | The total file size of Video assets transferred during the page load.                                |
| Domain Lookup Time               | The time taken in DNS lookup for the page.                                                           |
| Server Connection Time           | The time all samples spent in establishing a TCP connection to the page.                             |
| SSL Time                         | The time it takes the browser to handle SSL negotiation for the main/document HTML request.          |
| HTML Download Time               | TTFB plus the time taken to download the HTML.                                                       |

## Byte size

Byte size metrics relate to the uncompressed size of HTML, Images, JavaScript, CSS, Font, JSON and Video assets once they have been delivered to the client.

| Metric                         | Description                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Total HTML Size in Bytes       | The total, uncompressed file size of HTML assets transferred during the page load.                                 |
| Total JavaScript Size in Bytes | The total, uncompressed file size of JavaScript assets transferred during the page load.                           |
| Total Image Size in Bytes      | The total, uncompressed file size of Image (JPEG, PNG, GIF, Webp and SVG) assets transferred during the page load. |
| Total Font Size in Bytes       | The total, uncompressed file size of Font (EOT, TTF, WOFF and WOFF2) assets transferred during the page load.      |
| Total Page Size in Bytes       | The total, uncompressed file size of all page assets transferred during the page load.                             |
| Total CSS Size in Bytes        | The total, uncompressed file size of CSS assets transferred during the page load.                                  |
| Total JSON Size in Bytes       | The total, uncompressed file size of JSON assets transferred during the page load.                                 |
| Total Video Size in Bytes      | The total, uncompressed file size of Video assets transferred during the page load.                                |
