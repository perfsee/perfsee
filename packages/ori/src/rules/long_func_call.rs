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
use std::cell::RefCell;

pub struct LongFuncCall;

impl Rule for LongFuncCall {
  fn new() -> Box<Self> {
    Box::new(LongFuncCall)
  }

  fn code(&self) -> &'static str {
    "long-func-call"
  }

  fn desc(&self) -> &'static str {
    r#"Function calls on bottom of stack those last 33ms(requirement for 30 FPS) and more.
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
"#
  }

  fn analyse_profile(&self, ctx: &mut Context, profile: &Profile) {
    let stack = RefCell::new(vec![]);

    profile.for_each_call(
      |frame| {
        if frame.sourced && frame.node_module.is_none() {
          stack.borrow_mut().push(frame.latest_key());
        }
      },
      |frame, (_, total_weight)| {
        if frame.sourced && frame.node_module.is_none() {
          let mut stack = stack.borrow_mut();
          stack.pop();
          if stack.len() == 1 && total_weight > 33000 {
            ctx.add_diagnostic(
              self.code(),
              frame,
              json!({
                "unit": "us",
                "value": total_weight,
                "isSource": true,
              }),
            )
          }
        }
      },
    );
  }
}

#[cfg(test)]
mod tests {
  use super::LongFuncCall;

  #[test]
  fn long_func_call_found() {
    rule_invalid!(
      LongFuncCall,
      profile!(
        ["", "a:", "b:", "c:", "d:"],
        ["0;1;2;3 50000", "0;1;2;4 50000"]
      ),
      json!([{
        "code": "long-func-call",
        "key": "b::0:0",
        "info": {
          "unit": "us",
          "value": 100000,
          "isSource": true
        }
      }])
    );

    rule_invalid!(
      LongFuncCall,
      profile!(
        ["", "a:", "b:", "c:", "d:"],
        ["0;1;2;3 50000", "0;1;4 50000"]
      ),
      json!([{
          "code": "long-func-call",
          "key": "b::0:0",
          "info": { "unit": "us", "value": 50000, "isSource": true },
        },
        {
          "code": "long-func-call",
          "key": "d::0:0",
          "info": { "unit": "us", "value": 50000, "isSource": true },
        }
      ])
    );

    rule_invalid!(
      LongFuncCall,
      profile!(["", "render:react-dom", "a:", "b:"], ["0;1;2;3 50000"]),
      json!([{
        "code": "long-func-call",
        "key": "b::0:0",
        "info": {
          "unit": "us",
          "value": 50000,
          "isSource": true,
        }
      }])
    );
  }
  #[test]
  fn long_func_call_pass() {
    rule_pass!(
      LongFuncCall,
      profile!(["", "render:react-dom", "a:", "b:"], ["0;1;2;3 10000"])
    )
  }
}
