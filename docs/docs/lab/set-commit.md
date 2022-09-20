---
sidebar_position: 5
---

# Setting commit hash

The Treemap and Flamechart features in Lab require linking the data analyzed by Lab with the data analyzed by the Bundle product in order to use them. The platform uses git commit hash to associate Lab with Bundle. each Snapshot can have a commit hash set.

The commit hash is automatically set for tasks triggered by the Lab automation process, or for manually triggered Snapshots, as shown below.

![set commit](/lab/set-commit.png)

A snapshot can only set the commit hash once and cannot be modified. The analysis will be run after it is set, and there will be a delay (10 seconds or so) in the results.
