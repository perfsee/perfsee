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

use std::mem;

use serde::Serialize;
use serde_json::value::Value as JsonValue;

use crate::profile::Frame;
use crate::profile::Profile;

pub mod long_func_call;
pub mod long_lib_call;

pub trait Rule {
  fn new() -> Box<Self>
  where
    Self: Sized;
  fn analyse_profile(&self, ctx: &mut Context, profile: &Profile);
  fn code(&self) -> &'static str;
  fn desc(&self) -> &'static str {
    ""
  }
}

pub fn get_all_rules() -> Vec<Box<dyn Rule>> {
  vec![
    long_func_call::LongFuncCall::new(),
    long_lib_call::LongLibCall::new(),
  ]
}

#[derive(Serialize, Debug, Default)]
#[serde(rename_all(serialize = "camelCase"))]
pub struct Diagnostic {
  pub code: String,
  pub frame: Frame,
  pub bundle_hash: Option<String>,
  pub info: JsonValue,
}

#[derive(Default)]
pub struct Context {
  diagnostics: Vec<Diagnostic>,
}

impl Context {
  pub fn add_diagnostic(&mut self, code: &str, frame: &Frame, info: JsonValue) {
    self.diagnostics.push(Diagnostic {
      code: code.to_string(),
      frame: frame.clone(),
      bundle_hash: frame.bundle_hash.clone(),
      info,
    })
  }
}

pub struct Analyzer<'data> {
  profile: &'data Profile,
  rules: Vec<Box<dyn Rule>>,
  ctx: Context,
}

impl<'data> Analyzer<'data> {
  pub fn new(profile: &'data Profile, rules: Vec<Box<dyn Rule>>) -> Self {
    Analyzer {
      profile,
      rules,
      ctx: Context::default(),
    }
  }

  pub fn analyse(&mut self) -> Vec<Diagnostic> {
    for rule in self.rules.iter() {
      rule.analyse_profile(&mut self.ctx, self.profile);
    }

    mem::take(&mut self.ctx.diagnostics)
  }
}
