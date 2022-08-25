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

#![deny(clippy::all)]
// napi v1 macro didn't cover all generated unsafe code in unsafe blocks
// should remove after upgrading to v2
#![allow(clippy::not_unsafe_ptr_arg_deref)]

#[macro_use]
extern crate napi_derive;
#[macro_use]
extern crate serde_json;
use crate::profile::{Profile, SpeedScopeProfile, SpeedScopeProfileGroup};
use crate::rules::{get_all_rules, Analyzer, Diagnostic};
use napi::*;
use serde::Serialize;
use std::mem;

#[cfg(test)]
#[macro_use]
mod test_util;

#[macro_use]
mod utils;
pub mod parser;
pub mod profile;
pub mod rules;

#[cfg(all(
  unix,
  not(target_env = "musl"),
  not(target_arch = "aarch64"),
  not(target_arch = "arm"),
  not(debug_assertions)
))]
#[global_allocator]
static ALLOC: jemallocator::Jemalloc = jemallocator::Jemalloc;

#[cfg(all(windows, target_arch = "x86_64", not(debug_assertions)))]
#[global_allocator]
static ALLOC: mimalloc::MiMalloc = mimalloc::MiMalloc;

#[derive(Debug, Serialize)]
struct AnalyseResult {
  diagnostics: Vec<Diagnostic>,
  profile: Profile,
}

#[derive(Debug, Serialize)]
struct DebugAnalyseResult {
  diagnostics: Vec<Diagnostic>,
  profile: SpeedScopeProfileGroup,
}

struct AnalyzeTask {
  profile_path: String,
  bundle_meta_path: String,
  debug_mode: bool,
}

impl Task for AnalyzeTask {
  type Output = AnalyseResult;
  type JsValue = JsString;

  fn compute(&mut self) -> Result<Self::Output> {
    let profile = parser::parse(&self.profile_path, &self.bundle_meta_path)
      .map_err(|err| Error::new(Status::Unknown, format!("{:?}", err)))?;
    let mut analyzer = Analyzer::new(&profile, get_all_rules());
    let diagnostics = analyzer.analyse();

    Ok(AnalyseResult {
      diagnostics,
      profile,
    })
  }

  fn resolve(self, env: Env, mut output: Self::Output) -> Result<Self::JsValue> {
    if self.debug_mode {
      let dbg_result = DebugAnalyseResult {
        diagnostics: mem::take(&mut output.diagnostics),
        profile: SpeedScopeProfile::from(output.profile).group(),
      };

      env.create_string(&serde_json::to_string(&dbg_result)?)
    } else {
      env.create_string(&serde_json::to_string(&output)?)
    }
  }
}

#[js_function(3)]
pub fn analyse(ctx: CallContext) -> Result<JsObject> {
  let profile_path = ctx.get::<JsString>(0)?.into_utf8()?;
  let bundle_meta_path = ctx.get::<JsString>(1)?.into_utf8()?;
  let debug_mode = ctx.get::<JsBoolean>(2)?.get_value().unwrap_or(false);

  let task = AnalyzeTask {
    profile_path: profile_path.into_owned()?,
    bundle_meta_path: bundle_meta_path.into_owned()?,
    debug_mode,
  };
  let task = ctx.env.spawn(task)?;

  Ok(task.promise_object())
}

#[js_function]
pub fn gen_docs(ctx: CallContext) -> Result<JsObject> {
  let mut docs = ctx.env.create_object()?;

  let rules = get_all_rules();

  for rule in rules {
    docs.set_property(
      ctx.env.create_string(rule.code())?,
      ctx.env.create_string(rule.desc())?,
    )?;
  }

  Ok(docs)
}

#[module_exports]
fn export(mut exports: JsObject) -> Result<()> {
  exports.create_named_method("analyseProfile", analyse)?;
  exports.create_named_method("generateDocs", gen_docs)?;

  Ok(())
}
