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
use std::collections::HashMap;
use std::mem;

use napi::bindgen_prelude::*;
use serde::Serialize;

use crate::profile::{Profile, SpeedScopeProfile, SpeedScopeProfileGroup};
use crate::rules::{get_all_rules, Analyzer, Diagnostic};

#[cfg(test)]
#[macro_use]
mod test_util;

#[macro_use]
mod utils;
pub mod parser;
pub mod profile;
pub mod rules;

#[cfg(all(
  not(all(target_os = "linux", target_env = "musl", target_arch = "aarch64")),
  not(debug_assertions)
))]
#[global_allocator]
static ALLOC: mimalloc_rust::GlobalMiMalloc = mimalloc_rust::GlobalMiMalloc;

#[derive(Debug, Serialize)]
pub struct AnalyseResult {
  diagnostics: Vec<Diagnostic>,
  profile: Profile,
}

#[derive(Debug, Serialize)]
struct DebugAnalyseResult {
  diagnostics: Vec<Diagnostic>,
  profile: SpeedScopeProfileGroup,
}

pub struct AnalyzeTask {
  profile_path: String,
  bundle_meta_path: String,
  debug_mode: bool,
}

#[napi]
impl Task for AnalyzeTask {
  type Output = AnalyseResult;
  type JsValue = String;

  fn compute(&mut self) -> Result<Self::Output> {
    let profile = parser::parse(&self.profile_path, &self.bundle_meta_path)
      .map_err(|err| Error::new(Status::Unknown, format!("{err:?}")))?;
    let mut analyzer = Analyzer::new(&profile, get_all_rules());
    let diagnostics = analyzer.analyse();

    Ok(AnalyseResult {
      diagnostics,
      profile,
    })
  }

  fn resolve(&mut self, _: Env, mut output: Self::Output) -> Result<Self::JsValue> {
    let out = if self.debug_mode {
      let dbg_result = DebugAnalyseResult {
        diagnostics: mem::take(&mut output.diagnostics),
        profile: SpeedScopeProfile::from(output.profile).group(),
      };

      serde_json::to_string(&dbg_result)?
    } else {
      serde_json::to_string(&output)?
    };
    Ok(out)
  }
}

#[napi(strict)]
pub fn analyse_profile(
  profile_path: String,
  bundle_meta_path: String,
  debug_mode: Option<bool>,
) -> AsyncTask<AnalyzeTask> {
  let debug_mode = debug_mode.unwrap_or(false);

  let task = AnalyzeTask {
    profile_path,
    bundle_meta_path,
    debug_mode,
  };
  AsyncTask::new(task)
}

#[napi]
pub fn generate_docs() -> HashMap<&'static str, &'static str> {
  let rules = get_all_rules();

  rules
    .into_iter()
    .map(|rule| (rule.code(), rule.desc()))
    .collect()
}
