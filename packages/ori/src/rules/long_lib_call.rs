/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

use super::{Context, Rule};
use crate::profile::Profile;
use std::collections::BTreeMap;
use std::mem;

pub struct LongLibCall;

impl Rule for LongLibCall {
  fn new() -> Box<Self> {
    Box::new(LongLibCall)
  }

  fn code(&self) -> &'static str {
    "long-lib-call"
  }

  fn desc(&self) -> &'static str {
    r#"Same library function calls that totally take more then 33ms.

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
"#
  }

  fn analyse_profile(&self, ctx: &mut Context, profile: &Profile) {
    let mut root_frame = usize::MAX;
    let mut root_total_weight = 0;
    let mut lib_weight: BTreeMap<usize, u32> = BTreeMap::default();

    profile.for_each_sample(|sample, weight| {
      if sample.is_empty() {
        return;
      }

      let cur_root = sample.first().unwrap();
      if &root_frame == cur_root {
        root_total_weight += weight;
      } else {
        let lib_weight = mem::take(&mut lib_weight);
        if root_total_weight >= 33000 {
          for (frame_index, weight) in lib_weight {
            if weight >= 33000 {
              ctx.add_diagnostic(
                self.code(),
                profile.frames.get(frame_index).unwrap(),
                json!({
                  "unit": "us",
                  "value": weight,
                }),
              )
            }
          }
        }
        root_frame = cur_root.to_owned();
        root_total_weight = weight.to_owned();
      }

      let mut last_frame_index = None;
      let mut last_module = None;

      for &frame_index in sample.iter().rev() {
        let frame = profile.frames.get(frame_index).unwrap();
        if frame.node_module.is_none() {
          continue;
        }

        if last_module.is_none() {
          last_module = frame.node_module.clone();
          last_frame_index.replace(frame_index);
        } else if last_module == frame.node_module {
          last_frame_index.replace(frame_index);
        } else {
          lib_weight
            .entry(last_frame_index.unwrap())
            .and_modify(|total_weight| *total_weight += weight)
            .or_insert(*weight);
          break;
        }
      }
    });

    // clean up
    if !lib_weight.is_empty() && root_total_weight >= 33000 {
      for (frame_index, weight) in lib_weight {
        if weight >= 33000 {
          ctx.add_diagnostic(
            self.code(),
            profile.frames.get(frame_index).unwrap(),
            json!({
              "unit": "us",
              "value": weight,
            }),
          )
        }
      }
    }
  }
}

#[cfg(test)]
mod tests {
  use super::LongLibCall;

  #[test]
  fn long_lib_call_invalid() {
    rule_invalid!(
      LongLibCall,
      profile!(["a:a", "b:b", "c:b"], ["0;1;2 50000"]),
      json!([{
        "code": "long-lib-call",
        "key": "b::0:0",
        "info": {
          "unit": "us",
          "value": 50000,
        }
      }])
    );

    rule_invalid!(
      LongLibCall,
      profile!(["a:a", "b:b", "c:b"], ["0;1;2 50000", "0;1 3000"]),
      json!([{
        "code": "long-lib-call",
        "key": "b::0:0",
        "info": {
          "unit": "us",
          "value": 53000,
        }
      }])
    );

    rule_invalid!(
      LongLibCall,
      profile!(["a:a", "b:b", "c:b", "e:c"], ["0;1;2 50000", "3;1 100"]),
      json!([{
        "code": "long-lib-call",
        "key": "b::0:0",
        "info": {
          "unit": "us",
          "value": 50000,
        }
      }])
    );
  }

  #[test]
  fn long_lib_call_pass() {
    rule_pass!(
      LongLibCall,
      profile!(["a:a", "b:b", "c:c"], ["1;2 3000", "0 1", "1;2 3000"])
    )
  }
}
