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

use super::{Profile, ProfileError};
use anyhow::*;
use std::collections::BTreeMap;
use std::convert::TryFrom;
use std::fs::File;
use std::path::Path;

use super::{Frame, ToFrame};

use serde::Deserialize;

pub type Timeline = Vec<TraceEvent>;

#[derive(Debug, Deserialize)]
pub struct TraceEvent {
  ///
  /// The name of the event
  ///
  pub name: String,

  ///
  /// The event categories.
  ///
  /// This is a comma separated list of categories for the event.
  ///
  pub cat: String,

  ///
  /// The event type.
  ///
  #[serde(rename = "ph")]
  pub phase: Phase,

  ///
  /// The process ID for the process that output this event
  ///
  #[serde(rename = "pid")]
  pub process_id: i32,

  ///
  /// The thread ID for the thread that output this event
  ///
  #[serde(rename = "tid")]
  pub thread_id: i32,

  ///
  /// The tracing clock timestamp of the event. The timestamps are provided at microsecond granularity.
  ///
  #[serde(rename = "ts")]
  pub timestamp: u64,

  ///
  /// The thread clock timestamp of the event. The timestamps are provided at microsecond granularity.
  ///
  #[serde(rename = "tts")]
  pub thread_timestamp: Option<u64>,

  ///
  /// Any arguments provided for the event.
  ///
  /// Some of the event types have required argument fields, otherwise, you can put any information you wish in here.
  ///
  pub args: Args,

  ///
  /// Extra parameter to specify the tracing clock duration of Complete events in microseconds.
  ///
  pub dur: Option<u32>,
  ///
  /// Extra parameter to specify the thread clock duration of Complete events in microseconds.
  ///
  pub tdur: Option<u32>,

  ///
  /// Extra parameter provided to Instant events, Specifies the scope of event.
  ///
  /// There are four scopes available: global(g), process(p), thread(t).
  ///
  /// If no scope is provided we default to thread scoped events.
  ///
  #[serde(rename = "s")]
  pub instant_scope: Option<InstantScope>,

  ///
  /// Extra parameter for Async events.
  ///
  /// We consider the events with the same **category** and **id** as events from the same event tree.
  ///
  pub id: Option<Id>,

  ///
  /// Extra parameter for Async events.
  ///
  /// Specified to avoid **id** conflict,
  /// in which case we consider events with the same **category**, **scope**, **id** as events from the same event tree.
  ///
  pub scope: Option<String>,

  /// By default, async event ids are considered global among processes.
  ///
  /// So events in different processes with the same category and id are grouped in the same tree.
  ///
  /// On the other hand, by default, object event ids are considered process local.
  ///
  /// So, it is possible to create two different objects with the same id in different processes.
  ///
  /// These default behaviors can be too limiting in some cases.
  ///
  /// Therefore, we introduced a new id field, called id2, that can be used instead of the default id field and explicitly specify if it is process-local or global.
  pub id2: Option<Id2>,

  ///
  /// Exists to indicates Flow event's binding point is "next slice"
  ///
  pub bp: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Args {
  pub name: Option<String>,
  pub data: Option<Data>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all(deserialize = "camelCase"))]
pub struct Data {
  pub start_time: Option<u64>,
  pub end_time: Option<u64>,
  pub cpu_profile: Option<CpuProfile>,
  pub time_deltas: Option<Vec<i32>>,
}

#[derive(Debug, Deserialize)]
pub struct CpuProfile {
  pub nodes: Option<Vec<CpuProfileNode>>,
  pub samples: Vec<u32>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct CpuProfileNode {
  #[serde(rename = "callFrame")]
  pub call_frame: CallFrame,
  pub id: u32,
  pub parent: Option<u32>,
  pub children: Option<Vec<u32>>,
}

#[derive(Default, Debug, Deserialize, Clone)]
#[serde(rename_all(deserialize = "camelCase"))]
pub struct CallFrame {
  #[serde(default)]
  pub url: String,
  pub function_name: String,
  pub line_number: Option<i64>,
  pub column_number: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
pub enum Id {
  Integer(i64),
  String(String),
}

#[derive(Debug, Deserialize)]
pub struct Id2 {
  pub local: Option<String>,
  pub global: Option<String>,
}

#[derive(Debug, Deserialize)]
pub enum Phase {
  #[serde(rename = "B")]
  Begin,
  #[serde(rename = "E")]
  End,
  #[serde(rename = "X")]
  Complete,
  #[serde(rename = "I")]
  Instant,
  #[serde(rename = "i")]
  DeprecatedInstant,
  #[serde(rename = "C")]
  Counter,
  #[serde(rename = "b")]
  NestableBegin,
  #[serde(rename = "e")]
  NestableEnd,
  #[serde(rename = "n")]
  NestableInstant,
  #[serde(rename = "s")]
  FlowStart,
  #[serde(rename = "t")]
  FlowStep,
  #[serde(rename = "f")]
  FlowEnd,
  #[serde(rename = "P")]
  Sample,
  #[serde(rename = "N")]
  ObjectCreated,
  #[serde(rename = "O")]
  ObjectSnapshot,
  #[serde(rename = "D")]
  ObjectDestroyed,
  #[serde(rename = "M")]
  Metadata,
  #[serde(rename = "V")]
  MemoryDumpGlobal,
  #[serde(rename = "v")]
  MemoryDumpProcess,
  #[serde(rename = "R")]
  Mark,
  #[serde(rename = "c")]
  ClockSync,
  #[serde(rename = "S")]
  AsyncStart,
  #[serde(rename = "T")]
  AsyncStepInto,
  #[serde(rename = "P")]
  AsyncStepPast,
  #[serde(rename = "F")]
  AsyncStop,
}

#[derive(Debug, Default, Deserialize)]
pub enum InstantScope {
  #[serde(rename = "g")]
  Global,
  #[serde(rename = "p")]
  Process,
  #[serde(rename = "t")]
  #[default]
  Thread,
}

impl PartialEq for CpuProfileNode {
  fn eq(&self, other: &CpuProfileNode) -> bool {
    self.id == other.id
  }
}

#[derive(Default, Debug, Clone)]
pub struct ChromeProfile {
  pub thread_name: String,
  pub start_time: u64,
  pub end_time: u64,
  pub nodes: Vec<CpuProfileNode>,
  pub samples: Vec<u32>,
  pub time_deltas: Vec<i32>,
}

const KEY_EVENT_NAMES: [&str; 3] = ["Profile", "thread_name", "ProfileChunk"];

impl ToFrame for &CallFrame {
  #[inline]
  fn key(&self) -> String {
    format!(
      "{}:{}:{}:{}",
      self.name(),
      self.url,
      if let Some(line) = self.line() {
        line.to_string()
      } else {
        String::from("0")
      },
      if let Some(col) = self.col() {
        col.to_string()
      } else {
        String::from("0")
      },
    )
  }
  #[inline]
  fn name(&self) -> String {
    if !self.function_name.is_empty() {
      self.function_name.clone()
    } else {
      String::from("(anonymous)")
    }
  }
  #[inline]
  fn file(&self) -> String {
    self.url.clone()
  }
  #[inline]
  fn line(&self) -> Option<u32> {
    self.line_number.map(|line| (line + 1).max(1) as u32)
  }
  #[inline]
  fn col(&self) -> Option<u32> {
    self.column_number.map(|col| (col + 1).max(1) as u32)
  }
}

pub fn load_chrome_profile<P: AsRef<Path>>(file: P) -> Result<Vec<ChromeProfile>> {
  let events: Timeline = serde_json::from_reader(File::open(file)?)?;

  let mut profile_by_id: BTreeMap<String, ChromeProfile> = BTreeMap::default();
  let mut thread_name_by_pid_tid = BTreeMap::default();
  let mut pid_tid_by_id = BTreeMap::default();

  let mut events = events
    .into_iter()
    .filter(|event| KEY_EVENT_NAMES.contains(&event.name.as_str()))
    .collect::<Timeline>();

  events.sort_by_key(|event| event.timestamp);

  for event in events {
    let pid_tid = format!("{}:{}", event.process_id, event.thread_id);

    let id = if let Some(Id::String(id)) = event.id {
      id
    } else {
      pid_tid.clone()
    };

    match event.name.as_str() {
      "Profile" | "ProfileChunk" => {
        let data = event
          .args
          .data
          .expect("Missing `data` field for CpuProfile event args");
        if event.name.as_str() == "Profile" {
          pid_tid_by_id.insert(id.clone(), pid_tid);
        }

        let cpu_profile = profile_by_id.entry(id).or_insert_with(Default::default);

        if let Some(raw_cpu_profile) = data.cpu_profile {
          cpu_profile
            .nodes
            .extend(raw_cpu_profile.nodes.unwrap_or_default());

          cpu_profile.samples.extend(raw_cpu_profile.samples.iter());
        }

        if let Some(time_deltas) = data.time_deltas {
          cpu_profile.time_deltas.extend(time_deltas.iter());
        }

        if let Some(start_time) = data.start_time {
          cpu_profile.start_time = start_time;
        }

        if let Some(end_time) = data.end_time {
          cpu_profile.end_time = end_time;
        }
      }

      "thread_name" => {
        thread_name_by_pid_tid.insert(id, event.args.name.unwrap());
      }

      _ => {}
    }
  }

  if profile_by_id.is_empty() {
    return Err(anyhow!("No profile data"));
  }

  let mut profiles = vec![];
  for (profile_id, mut chrome_profile) in profile_by_id {
    let thread_name = pid_tid_by_id
      .get(&profile_id)
      .map(|pid_tid| thread_name_by_pid_tid.get(pid_tid));

    if let Some(Some(thread_name)) = thread_name {
      chrome_profile.thread_name = thread_name.to_owned();
    } else {
      chrome_profile.thread_name = "(anonymous thread)".to_owned();
    }

    profiles.push(chrome_profile);
  }

  Ok(profiles)
}

fn should_place_on_top_of_stack(function_name: &str) -> bool {
  matches!(function_name, "(garbage collector)" | "(program)")
}

impl TryFrom<ChromeProfile> for Profile {
  type Error = Error;

  fn try_from(chrome_profile: ChromeProfile) -> Result<Self, Self::Error> {
    let nodes = chrome_profile.nodes;
    let samples = chrome_profile.samples;
    let time_deltas = chrome_profile.time_deltas;
    if nodes.is_empty() || time_deltas.is_empty() || samples.is_empty() {
      return Err(anyhow!(ProfileError::NonNode));
    }
    let mut parent_by_id = BTreeMap::new();
    let mut node_by_id = BTreeMap::new();

    for mut node in nodes {
      if let Some(parent_id) = node.parent.take() {
        parent_by_id.insert(node.id, parent_id);
      }
      if let Some(children) = node.children.take() {
        parent_by_id.extend(children.into_iter().map(|child_id| (child_id, node.id)));
      }
      node_by_id.entry(node.id).or_insert(node);
    }

    let mut profile = Profile::new(chrome_profile.thread_name);

    let mut elapsed = 0;
    let mut samples_with_timestamp = samples
      .into_iter()
      .zip(time_deltas)
      .map(|(node_id, delta)| {
        elapsed += delta;
        (node_id, elapsed)
      })
      .collect::<Vec<(u32, i32)>>();

    // correct order of samples with negative timeDelta
    samples_with_timestamp.sort_by_key(|(_, a)| *a);

    let mut stack = vec![];
    let mut elapsed = 0;
    let mut node_id = u32::MAX;

    // simplier way to take last samples into count
    samples_with_timestamp.push((u32::MAX, samples_with_timestamp.last().unwrap().1));

    samples_with_timestamp
      .into_iter()
      .for_each(|(next_node_id, timestamp)| {
        if node_id == u32::MAX || node_id == next_node_id {
          // reduce call with same node_id and depth.
          node_id = next_node_id;
          return;
        }

        let weight = (timestamp - elapsed) as u32;
        elapsed = timestamp;

        if let Some(node) = node_by_id.get(&node_id) {
          // Find lowest common ancestor of the current stack and the previous one
          let mut lca = if should_place_on_top_of_stack(&node.call_frame.function_name) {
            stack.last().copied()
          } else {
            Some(node_id)
          };

          // reversed call tree
          let mut to_open = vec![];

          while let Some(incoming) = lca.take() {
            match stack.iter().rposition(|id| id == &incoming) {
              Some(index) => {
                while stack.len() > index + 1 {
                  let to_close = stack.pop().unwrap();
                  profile.close_frame(to_close);
                }
              }
              _ => {
                to_open.push(incoming);
                lca = parent_by_id.get(&incoming).copied();
              }
            }
          }

          if to_open.is_empty() {
            match stack.last() {
              Some(&top) if node_id == top => {
                profile.append_frame(node_id, weight);
              }
              _ => {
                profile.open_frame(node_id, Frame::from(&node.call_frame), weight);
                profile.close_frame(node_id);
              }
            }
          } else {
            for open_id in to_open.into_iter().rev() {
              let node = node_by_id.get(&open_id).unwrap();
              stack.push(open_id);
              profile.open_frame(
                open_id,
                Frame::from(&node.call_frame),
                if open_id == node_id { weight } else { 0 },
              );
            }
          }
        }

        node_id = next_node_id;
      });

    for node_id in stack.into_iter().rev() {
      profile.close_frame(node_id);
    }

    profile.start_value = chrome_profile.start_time;
    profile.end(elapsed as u64 + chrome_profile.start_time);

    Ok(profile)
  }
}

#[cfg(test)]
mod tests {
  use super::load_chrome_profile;
  use super::Profile;
  use crate::test_util::get_sample_path;
  use std::convert::TryFrom;

  #[test]
  fn from_simple_chrome_profile() {
    let chrome_profile = load_chrome_profile(get_sample_path("chrome/simple.sample"))
      .unwrap()
      .pop()
      .unwrap();
    let profile = Profile::try_from(chrome_profile);
    assert!(profile.is_ok());
    let profile = profile.unwrap();
    assert_eq!(&profile.name, "(anonymous thread)");
    insta::assert_json_snapshot!(profile);
  }

  #[test]
  fn from_complex_chrome_profile() {
    let chrome_profiles = load_chrome_profile(get_sample_path("chrome/worker.sample")).unwrap();
    let profiles: Vec<_> = chrome_profiles
      .into_iter()
      .map(|chrome_profile| Profile::try_from(chrome_profile).unwrap())
      .collect();
    insta::assert_json_snapshot!(profiles);
  }
}
