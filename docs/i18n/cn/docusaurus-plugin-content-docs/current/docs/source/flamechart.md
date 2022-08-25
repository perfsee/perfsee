---
sidebar_position: 4
---

# 如何阅读与使用火焰图

## 什么是火焰图？

宽泛意义上的火焰图（Flame Graph）指的是：在程序运行期间，程序调用栈信息的可视化展示，横坐标是函数调用，纵坐标调用栈深度。因其可视化后图像酷似火焰，故得名火焰图。

<span id="图一">![火焰图](/source/flame-graph.png)</span>

图 1. 火焰图 flame graph

在火焰图中，函数的调用关系是从下往上的。以上图为例，可以还原出调用关系是：

```
// a => b 定义为： 函数 a 调用了 函数 b
root
  => mysqld`handle_select
    => mysqld`mysql_select
      => mydqld`JOIN::exec
        => mysqld`create_sort_index
          => ...
```

---

作为前端开发人员，最长接触的到火焰图可能是 Chrome Devtools 中给我们提供的[运行时性能分析功能](https://developer.chrome.com/docs/devtools/evaluate-performance/reference/)。

但 Chrome Devtool 给出的火焰图通常是以另一种形式出现：横坐标是**时间（有别于上述定义）**，纵坐标是调用栈深度，而且可视化之后是倒置的火焰或者说是瀑布。因为横坐标的意义变了，所以 Chrome 团队也称之为 Flame Chart，而非 Flame Graph（虽然中译还是“火焰图”，但是二者是有明显差异的）。

![火焰图](/source/chrome-flamechart.jpg)

图 2. Perfsee 中的火焰图（Flame Chart）

很显然在前端场景中，后者（Flame Chart）可以更贴切地展示出页面加载、执行时间信息，并且可以结合 FP、FCP、TTI 等关键性能指标，给开发者直观的优化指导。所以我们接下来谈论的火焰图，都指的是类 Chrome devtool 中的火焰图（Flame Chart）

---

## 火焰图的生成原理

**在一段时间内**，定时地（100 μs ~ 1000 μs，1000 μs = 1 ms）将程序 **当前的运行时栈** 做一次快照。因为快照的间隔时间极短，同一个栈在多次**连续快照**中的时间总和，可以视为该 **栈顶函数**本次的**调用时间**。

### 如何阅读火焰图？

1. **理解调用栈及调用关系**

火焰图中函数的调用栈是与 [图一](#图一) 中上下层关系是相反的，即上层函数调用下层函数。
如下图中，函数的调用关系为 `i` 调用了 `Ce`，`Ce` 又调用了 `S.forEach`，以此类推。

![火焰图示例](/source/flamechart-top-down.png)

图 3. 调用关系示例

2. **函数执行时间**

> 函数执行时间是新接触火焰图的人最难理解的部分，但却是最关键的部分。

函数执行时间分为 **总时间（Total Time）** 和 **自执行时间（Self Time）**。
`总时间`很好理解，就是一个函数从函数体的第一行执行到最后一行结束一共花掉的时间。自执行时间 就是在`总时间` 里，去掉调用其他函数所花的时间。
所以就有`Total Time = Self Time + Children TotalTime`。

回到火焰图中，图中每一个方块在横坐标的**时间跨度**即为该函数调用的`总时间`。

![总时间](/source/flamechart-total-time.png)

图 4. 函数执行时间

如上图中，被选中高亮的函数`checkDeferredModules` 横坐标跨度为 1.32 秒，这便是该函数的执行`总时间`。往下顺着调用栈又看到，该函数紧接着就调用了另一个函数`__webpack_require__`，而 `__webpack_require__` 的`总时间`也是 1.32 秒。根据上面的时间计算公式，就可以理解为 `checkDeferredModules` 这个函数的`自执行时间`**短到可以忽略不计**，所以我们在阅读的过程中就可以忽略掉这个函数不用去考虑优化其性能，转而将目标聚焦于被它调用的那些函数。
类似的，在下图中，函数 `XI` 为最顶层的（最后一个被调用）函数，但在其执行过程中引擎触发了一次 GC，除去 GC 时间剩下的部分便是函数 `XI`的`自执行时间`。

![](/source/flamechart-self-time.png)

图 5. 自执行时间

总结得到我们阅读火焰图的过程中，需要首先需要关注的函数是那些在火焰图中占据了较长时间跨度的函数，再沿着函数调用栈路径，找出调用路径中**自执行时间**较长的函数调用，从而精准的取得运行时间的优化成果。

## 参考

- [Flame Graphs](http://www.brendangregg.com/flamegraphs.html)
- [Chrome Devtools](https://developer.chrome.com/docs/devtools/evaluate-performance/reference/)
