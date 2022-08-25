# Perfsee source code analyzing rules

## Rules

| rule                              |
| --------------------------------- |
| [long-func-call](#long-func-call) |
| [long-lib-call](#long-lib-call)   |

### **long-func-call**

Function calls on bottom of stack those last 33ms(requirement for 30 FPS) and more.
These kind of function call are always the root cause of long tasks no matter
how short theirselves weights(evaluation time) are.

> Third party libs' call should be filtered out,
> because we want to find out the root causes in the project's own code.

#### Examples:

```text
// fnA counts
------- fnC -------
------- fnB -------   -------- fnD --------------
------------ fnA (total time > 33ms) ------------

// fnB counts
// react-dom.render ignored
------- fnC -------
--------- fnB (total time > 33ms) --------------------
------------ react-dom.render ------------------------

// fnB counts
// edge case here:
// `fetch.then` or `xhr.onStateReadyChanged` or some interceptor functions are totally innocent
------- fnC -------
--------- fnB (total time > 33ms) --------------------
------------- fetch.then -----------------------------
```

### **long-lib-call**

Same library function calls that totally take more then 33ms.

> Function calls under the root call where total time is less then 33ms are ignored.
> They are innocent for causing user interaction blocking.

To achieve better accuracy, we would trace down to the lowest third party lib call and record it.
For instance, we should only record `react.a` calling because there may be no way to know how `react.b` or `react.c` is called internally:

```text
react.a => react.b => react.c
```

#### Examples:

```text
// ignored
------- f -------  ------- f -------
------- stack root (total time < 33ms) -------

// react.a counts:
--- react.b (total time > 33ms) ----
---------------- react.a -----------------------
--------------------- antd.a -------------------
------- stack root (total time >= 33ms) --------
```
