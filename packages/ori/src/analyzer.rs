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

use std::collections::HashMap;
use std::mem;

use serde::Serialize;
use serde_json::value::Value as JsonValue;

use crate::gatherers::Gatherer;
use crate::profile::Frame;
use crate::profile::Profile;

use crate::rules::*;

#[derive(Serialize, Debug, Default)]
#[serde(rename_all(serialize = "camelCase"))]
pub struct Diagnostic {
  pub code: String,
  pub frame: Frame,
  pub bundle_hash: Option<String>,
  pub info: JsonValue,
}

#[derive(Serialize, Debug)]
pub struct Artifact(serde_json::Value);

#[derive(Default)]
pub struct Context {
  diagnostics: Vec<Diagnostic>,
  artifacts: HashMap<String, Artifact>,
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

  pub fn add_artifact(&mut self, name: &str, artifact: impl Serialize) {
    self.artifacts.insert(
      name.to_string(),
      Artifact(serde_json::to_value(artifact).unwrap()),
    );
  }
}

pub struct Analyzer<'data> {
  profile: &'data Profile,
  rules: Vec<Box<dyn Rule>>,
  gatherers: Vec<Box<dyn Gatherer>>,
  ctx: Context,
}

impl<'data> Analyzer<'data> {
  pub fn new(
    profile: &'data Profile,
    rules: Vec<Box<dyn Rule>>,
    gatherers: Vec<Box<dyn Gatherer>>,
  ) -> Self {
    Analyzer {
      profile,
      rules,
      gatherers,
      ctx: Context::default(),
    }
  }

  pub fn analyse(&mut self) -> (Vec<Diagnostic>, HashMap<String, Artifact>) {
    for rule in self.rules.iter() {
      rule.analyse_profile(&mut self.ctx, self.profile);
    }

    for gatherer in self.gatherers.iter() {
      gatherer.analyse_profile(&mut self.ctx, self.profile);
    }

    (
      mem::take(&mut self.ctx.diagnostics),
      mem::take(&mut self.ctx.artifacts),
    )
  }
}
