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

use super::profile::Frame;
use super::rules::{Diagnostic, Rule};
use serde::{Deserialize, Serialize};
use serde_json::value::Value as JsonValue;
use std::env::current_dir;
use std::path::PathBuf;

pub fn get_sample_path(path: &str) -> PathBuf {
  current_dir().unwrap().join("sample").join(path)
}

impl From<&str> for Frame {
  fn from(s: &str) -> Frame {
    let mut frame = Frame {
      key: String::from(""),
      name: String::from(""),
      file: String::from(""),
      line: None,
      col: None,
      sourced: false,
      node_module: None,
    };

    if s.is_empty() {
      frame.name = String::from("(anonymouse)");
    } else {
      let parts: Vec<_> = s.split(':').collect();
      if let Some(&name) = parts.get(0) {
        if !name.is_empty() {
          frame.sourced = true;
        }
        frame.name = String::from(name);
      }
      if let Some(&module) = parts.get(1) {
        if !module.is_empty() {
          frame.node_module = Some(String::from(module));
        }
      }
    }
    frame.update_key();
    frame
  }
}

pub fn get_sample_weight(stack: &str) -> (Vec<usize>, u32) {
  let mut parts: Vec<_> = stack.split(' ').collect();
  assert!(parts.len() == 2);

  let weight: u32 = parts.pop().unwrap().parse().unwrap();
  let samples: Vec<usize> = parts
    .pop()
    .unwrap()
    .split(';')
    .map(|index| index.parse().unwrap())
    .collect();

  (samples, weight)
}

macro_rules! profile {
  ([ $( $f:literal ),* ], [ $( $s:literal ),* ]) => ({
    let mut frames = vec![];
    let mut frame_index_by_key = std::collections::BTreeMap::new();
    let mut samples = vec![];
    let mut weights = vec![];

    $(
      let frame = $crate::profile::Frame::from($f);
      frame_index_by_key.insert(frame.key.clone(), frames.len());
      frames.push(frame);
    )*

    $(
      let (sample, weight) = $crate::test_util::get_sample_weight($s);
      samples.push(sample);
      weights.push(weight);
    )*

    $crate::profile::Profile {
      frames,
      samples,
      weights,
      ..Default::default()
    }
  });
}

macro_rules! rule_pass {
  ($rule:ty, $prof:expr) => {{
    let profile = $prof;
    let mut analyzer =
      $crate::rules::Analyzer::new(&profile, $crate::test_util::get_rules::<$rule>());
    let diagnostics = analyzer.analyse();
    if !diagnostics.is_empty() {
      panic!("Unexpected diagnostics found:\n{:#?}", diagnostics);
    }
  }};
}

macro_rules! rule_invalid {
  ($rule:ty, $prof:expr, $diags:expr) => {{
    let profile = $prof;
    let expected_diagnostics: Vec<$crate::test_util::SimpleDiagnostic> =
      serde_json::from_value($diags).unwrap();
    let mut analyzer =
      $crate::rules::Analyzer::new(&profile, $crate::test_util::get_rules::<$rule>());
    let diagnostics = analyzer.analyse();
    let diagnostics: Vec<_> = diagnostics
      .into_iter()
      .map($crate::test_util::SimpleDiagnostic::from)
      .collect();

    assert_eq!(
      expected_diagnostics.len(),
      diagnostics.len(),
      "{} diagnostics expected, but got {}.",
      expected_diagnostics.len(),
      diagnostics.len()
    );
    for (expected, got) in expected_diagnostics.iter().zip(&diagnostics) {
      assert_eq!(
        expected.code, got.code,
        "Rule code is expected to be \"{}\", but got \"{}\"",
        expected.code, got.code
      );
      assert_eq!(
        expected.key, got.key,
        "Diagnostics frame key is expected to be \"{}\", but got \"{}\"",
        expected.key, got.key
      );
      assert_eq!(
        expected.info, got.info,
        "Diagnostics info is expected to be \"{:?}\", but got \"{:?}\"",
        expected.info, got.info
      );
    }
  }};
}

#[derive(Serialize, Deserialize)]
pub struct SimpleDiagnostic {
  pub code: String,
  pub key: String,
  pub info: JsonValue,
}

impl From<Diagnostic> for SimpleDiagnostic {
  fn from(raw: Diagnostic) -> Self {
    SimpleDiagnostic {
      code: raw.code,
      key: raw.frame.key,
      info: raw.info,
    }
  }
}

pub fn get_rules<T: Rule + 'static>() -> Vec<Box<dyn Rule>> {
  vec![T::new()]
}
