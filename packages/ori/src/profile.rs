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

pub mod chrome_profile;

use anyhow::*;
use chrome_profile::load_chrome_profile;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::convert::TryFrom;
use std::mem;
use std::path::Path;
use thiserror::*;

#[derive(Default, Serialize, Deserialize, Debug, Clone)]
pub struct Frame {
  pub key: String,
  pub name: String,
  pub file: String,
  pub line: Option<u32>,
  pub col: Option<u32>,
  #[serde(skip)]
  pub bundle_hash: Option<String>,
  #[serde(skip)]
  pub sourced: bool,
  #[serde(skip)]
  pub origin_script_file: String,
  #[serde(skip)]
  pub node_module: Option<String>,
}

impl Frame {
  pub fn latest_key(&self) -> String {
    format!(
      "{}:{}:{}:{}",
      self.name,
      self.file,
      if let Some(line) = self.line {
        line.to_string()
      } else {
        String::from("0")
      },
      if let Some(col) = self.col {
        col.to_string()
      } else {
        String::from("0")
      },
    )
  }

  pub fn update_key(&mut self) {
    self.key = self.latest_key();
  }
}

pub trait ToFrame {
  fn key(&self) -> String;
  fn name(&self) -> String;
  fn file(&self) -> String;
  fn line(&self) -> Option<u32>;
  fn col(&self) -> Option<u32>;
}

impl<T: ToFrame> From<T> for Frame {
  fn from(t: T) -> Self {
    Frame {
      key: t.key(),
      name: t.name(),
      file: t.file(),
      line: t.line(),
      col: t.col(),
      origin_script_file: t.file(),
      ..Frame::default()
    }
  }
}

type FrameIndex = usize;
type Weight = u32;
type SelfWeight = Weight;
type TotalWeight = Weight;
type Sample = Vec<FrameIndex>;
type Samples = Vec<Sample>;
type Weights = Vec<Weight>;

#[derive(Error, Debug)]
pub enum ProfileError {
  #[error("Could not found main thread profile data")]
  MissingMainThread,
  #[error("No call tree node found in timeline")]
  NonNode,
  #[error("Meet invalid samples and time data")]
  InvalidSamples,
}

pub fn load_chrome_main_thread_profile<P: AsRef<Path>>(path: P) -> Result<Profile> {
  let chrome_profiles = load_chrome_profile(path)?;
  if let Some(main_thread_profile) = chrome_profiles
    .into_iter()
    .find(|chrome_profile| chrome_profile.thread_name == "CrRendererMain")
  {
    Profile::try_from(main_thread_profile)
  } else {
    Err(anyhow!(ProfileError::MissingMainThread))
  }
}

#[derive(Default, Debug)]
pub struct CallTreeNode {
  pub node_id: u32,
  pub frame_index: FrameIndex,
  pub self_weight: SelfWeight,
  pub total_weight: TotalWeight,
}

#[derive(Default, Debug, Serialize)]
pub struct Profile {
  #[serde(skip)]
  pub name: String,
  #[serde(rename = "startTime")]
  pub start_value: u64,
  #[serde(rename = "endTime")]
  pub end_value: u64,
  #[serde(skip)]
  pub frame_index_by_key: BTreeMap<String, FrameIndex>,
  #[serde(skip)]
  pub stack: Vec<CallTreeNode>,
  pub frames: Vec<Frame>,
  pub samples: Samples,
  pub weights: Weights,
}

impl Profile {
  pub fn new(name: String) -> Self {
    Profile {
      name,
      ..Default::default()
    }
  }

  pub fn for_each_call<E, C>(&self, mut enter_frame: E, mut close_frame: C)
  where
    E: FnMut(&Frame),
    C: FnMut(&Frame, (SelfWeight, TotalWeight)),
  {
    let mut stack: Vec<CallTreeNode> = Vec::with_capacity(self.stack.capacity());

    self.for_each_sample(|sample, weight| {
      let mut lca = 0;

      while lca < sample.len() && lca < stack.len() {
        let call_node = stack.get_mut(lca).unwrap();
        if sample[lca] == call_node.frame_index {
          call_node.total_weight += weight;
        } else {
          break;
        }

        lca += 1;
      }

      while stack.len() > lca {
        let top = stack.pop().unwrap();
        let frame = self.frames.get(top.frame_index).unwrap();
        close_frame(frame, (top.self_weight, top.total_weight));
      }

      let mut to_open = lca;
      while to_open < sample.len() {
        let frame_index = sample[to_open];
        let mut call_node = CallTreeNode {
          frame_index,
          self_weight: 0,
          total_weight: weight.to_owned(),
          ..Default::default()
        };

        if to_open == sample.len() - 1 {
          call_node.self_weight = weight.to_owned();
        }

        stack.push(call_node);
        let frame = self.frames.get(frame_index).unwrap();
        enter_frame(frame);
        to_open += 1;
      }
    });

    stack.into_iter().rev().for_each(|call_node| {
      let frame = self.frames.get(call_node.frame_index).unwrap();
      close_frame(frame, (call_node.self_weight, call_node.total_weight));
    });
  }

  pub fn for_each_sample<F>(&self, mut append_sample: F)
  where
    F: FnMut(&Sample, &Weight),
  {
    self
      .samples
      .iter()
      .zip(self.weights.iter())
      .for_each(|(sample, weight)| {
        append_sample(sample, weight);
      });
  }

  fn open_frame(&mut self, node_id: u32, frame: Frame, weight: Weight) {
    self.add_weight_to_stack(weight);

    let frames = &mut self.frames;
    let frame_index = match self.frame_index_by_key.get(&frame.key) {
      Some(&index) => index,
      None => {
        let index = frames.len();
        self.frame_index_by_key.insert(frame.key.clone(), index);
        frames.push(frame);

        index
      }
    };

    self.stack.push(CallTreeNode {
      node_id,
      frame_index,
      self_weight: weight,
      total_weight: weight,
    });

    if weight > 0 {
      self.snapshot(weight);
    }
  }

  fn add_weight_to_stack(&mut self, weight: Weight) {
    self.stack.iter_mut().for_each(|call_node| {
      call_node.total_weight += weight;
    })
  }

  fn append_frame(&mut self, node_id: u32, weight: u32) {
    self.add_weight_to_stack(weight);

    match self.stack.last().map(|call_node| call_node.node_id) {
      Some(top) if node_id == top => {
        self.snapshot(weight);
      }
      _ => {}
    }
  }

  fn close_frame(&mut self, node_id: u32) {
    if let Some(stack_top) = self.stack.last() {
      if stack_top.node_id == node_id {
        self.stack.pop();
      }
    }
  }

  fn snapshot(&mut self, weight: Weight) {
    let sample = self
      .stack
      .iter()
      // skip the root node
      .skip(1)
      .map(|call_node| call_node.frame_index)
      .collect();
    self.samples.push(sample);
    self.weights.push(weight);
  }

  fn end(&mut self, end_value: u64) {
    self.stack.clear();
    self.end_value = end_value;
  }
}

#[derive(Default, Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SpeedScopeProfile {
  #[serde(rename = "type")]
  pub profile_type: String,
  pub unit: String,
  pub name: String,
  pub start_value: u64,
  pub end_value: u64,
  pub samples: Samples,
  pub weights: Weights,
  pub frames: Vec<Frame>,
}

#[derive(Debug, Default, Deserialize, Serialize)]
pub struct SharedInfo {
  frames: Vec<Frame>,
}

#[derive(Debug, Default, Deserialize, Serialize)]
pub struct SpeedScopeProfileGroup {
  exporter: String,
  #[serde(rename = "$schema")]
  schema: String,
  name: String,
  profiles: Vec<SpeedScopeProfile>,
  shared: SharedInfo,
}

impl SpeedScopeProfile {
  pub fn merge(profiles: Vec<SpeedScopeProfile>) -> SpeedScopeProfileGroup {
    let mut frames = vec![];
    let mut grouped_profiles = vec![];
    let mut start_frame_index = 0;

    for mut profile in profiles {
      let frame_len = profile.frames.len();
      let profile_frames = mem::take(&mut profile.frames);

      frames.extend(profile_frames.into_iter());

      let samples = &mut profile.samples;
      samples.iter_mut().for_each(|sample| {
        sample
          .iter_mut()
          .for_each(|index| *index += start_frame_index);
      });

      grouped_profiles.push(profile);
      start_frame_index += frame_len;
    }

    SpeedScopeProfileGroup {
      exporter: "speedscope@0.6.0".to_string(),
      schema: "https://www.speedscope.app/file-format-schema.json".to_string(),
      name: "any".to_string(),
      profiles: grouped_profiles,
      shared: SharedInfo { frames },
    }
  }

  pub fn group(self) -> SpeedScopeProfileGroup {
    SpeedScopeProfile::merge(vec![self])
  }
}

impl From<Profile> for SpeedScopeProfile {
  fn from(mut profile: Profile) -> Self {
    SpeedScopeProfile {
      samples: mem::take(&mut profile.samples),
      weights: mem::take(&mut profile.weights),
      frames: mem::take(&mut profile.frames),
      profile_type: "sampled".to_string(),
      unit: "microseconds".to_string(),
      start_value: profile.start_value,
      end_value: profile.end_value,
      name: profile.name.clone(),
    }
  }
}
