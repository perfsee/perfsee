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

use super::profile::{load_chrome_main_thread_profile, Profile};
use anyhow::Result;
use rayon::prelude::*;
use regex::Regex;
use serde::Deserialize;
use sourcemap::SourceMap as RawSourceMap;
use std::collections::HashMap;
use std::fs::File;
use std::ops::Deref;

struct SourceMap(RawSourceMap);

unsafe impl Send for SourceMap {}
unsafe impl Sync for SourceMap {}

impl Deref for SourceMap {
  type Target = RawSourceMap;
  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

#[derive(Deserialize)]
#[serde(rename_all(deserialize = "camelCase"))]
struct FileMeta {
  src: String,
  disk_path: String,
  bundle_id: String,
}

#[derive(Deserialize)]
#[serde(rename_all(deserialize = "camelCase"))]
struct Bundle {
  module_map: HashMap<String, String>,
  repo_path: Option<String>,
  build_path: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all(deserialize = "camelCase"))]
struct BundleMeta {
  files: Vec<FileMeta>,
  bundles: HashMap<String, Bundle>,
}

impl BundleMeta {
  fn find_bundle(&self, file: &str) -> Option<&Bundle> {
    // the bundle visiting url may not equal webpack.publicPath + asset.name
    self
      .files
      .iter()
      .find(|file_meta| file == &file_meta.src)
      .and_then(|file_meta| self.bundles.get(&file_meta.bundle_id))
  }

  fn module_name_by_file(&self, file: &str, mod_id: &str) -> Option<&str> {
    self
      .find_bundle(file)
      .and_then(|bundle| bundle.module_map.get(mod_id).map(|s| s.as_str()))
  }

  fn generate_source_maps(&self) -> Vec<(&str, &str, SourceMap)> {
    self
      .files
      .par_iter()
      .filter_map(|meta| {
        let source_map_file = meta.disk_path.clone() + ".map";

        match File::open(&source_map_file) {
          Ok(file_reader) => match RawSourceMap::from_reader(file_reader) {
            Ok(source_map) => Some((
              meta.bundle_id.as_str(),
              meta.src.as_str(),
              SourceMap(source_map),
            )),
            Err(e) => {
              println!(
                "Failed to parse source map: {:?}, file: {}",
                e, source_map_file
              );
              None
            }
          },
          Err(e) => {
            println!(
              "Failed to create file reader: {:?}, file: {}",
              e, source_map_file
            );
            None
          }
        }
      })
      .collect()
  }

  /// with webpack < 5, sources values in source map are always converted to absolute path.
  ///
  /// And with eden, there plenty of cases that project are built with `cd xxx & eden build` which will
  /// makes some relative paths based by the 'xxx' inner project root.
  ///
  /// So we need to use `repo_path(where repo cloned in)` and webpack building `build_path(cd xxx/xxx && build)` to recover them back to
  /// project root based relative path.
  ///
  /// ```ignore
  /// // with:
  /// repo_path = '/usr/worker/perfsee'
  /// build_path = 'packages/platform'
  /// // we could do the following conversion:
  ///
  /// absoluteSource: '/usr/worker/perfsee/node_modules/...'
  /// returns: './node_modules/...'
  ///
  /// // cd platform && yarn build
  /// relativeSource: './src/xxx'
  /// returns: './packages/platform/xxx'
  /// ```
  ///
  fn to_relative_path(&self, bundle_id: &str, path: &str) -> String {
    let bundle = self.bundles.get(bundle_id).unwrap();
    if bundle.repo_path.is_none() {
      return path.to_owned();
    }

    let repo_path = bundle.repo_path.as_ref().unwrap();
    let build_path = bundle.build_path.as_deref();

    to_relative_path(path, repo_path, build_path)
  }
}

fn to_relative_path(path: &str, abs_prefix: &str, relative_prefix: Option<&str>) -> String {
  if path.starts_with('/') && path.len() < abs_prefix.len() {
    return path.to_owned();
  }

  let buf = if path.starts_with('/') {
    // could directly truncate with `abs_prefix`
    join!(".", &path[abs_prefix.len() + 1..])
  } else {
    join!(".", relative_prefix.unwrap_or(""), path)
  };

  buf
    .into_os_string()
    .into_string()
    .unwrap_or_else(|_| path.to_owned())
}

const SOURCE_REGEXP: &str = r"^(@[^/]+/)?([^/]+)?/(?P<path>[^?]+)\??\w*$";
/// recover real resource/module path from webpack source map sources.
///
/// sse more: https://github.com/webpack/webpack/blob/master/lib/SourceMapDevToolPlugin.js#L131
///
/// formatted in:
/// `"webpack://[namespace]/(resourcePath)[?[hash]]"`
/// `"(resourcePath)"`
fn strip_source_path_prefix<'a>(source: &'a str, reg: &Regex) -> &'a str {
  if let Some(path) = source.strip_prefix("webpack://") {
    // keep webpack internal modules
    if path.starts_with("webpack/") {
      return path;
    }

    if let Some(caps) = reg.captures(path) {
      return caps.name("path").map(|m| m.as_str()).unwrap_or(path);
    }
  }

  source
}

pub fn get_node_module(path: &str) -> &str {
  let mut parts: Vec<_> = path.split("/node_modules/").collect();

  if parts.len() == 1 {
    return "";
  }

  if let Some(last_module) = parts.pop() {
    let matches: Vec<_> = last_module.match_indices('/').collect();
    // edge case: module sync *
    if matches.is_empty() {
      return last_module;
    }

    if last_module.starts_with('@') {
      // edge case: @semi/icons sync *
      if matches.len() < 2 {
        return last_module;
      }
      return &last_module[..matches[1].0];
    }

    return &last_module[..matches[0].0];
  }

  ""
}

pub fn parse(profile_path: &str, bundle_meta_path: &str) -> Result<Profile> {
  let bundle_meta: BundleMeta = serde_json::from_reader(File::open(bundle_meta_path)?)?;
  let source_maps = bundle_meta.generate_source_maps();

  let source_regex = Regex::new(SOURCE_REGEXP).unwrap();

  let mut profile = load_chrome_main_thread_profile(profile_path)?;
  if !source_maps.is_empty() {
    profile.frames.par_iter_mut().for_each(|frame| {
      if frame.line.is_none() || frame.col.is_none() {
        return;
      }

      let source_map = source_maps
        .iter()
        .find(|(_, asset, _)| frame.file == *asset);

      if source_map.is_none() {
        return;
      }

      let line = frame.line.unwrap();
      let col = frame.col.unwrap();

      let bundle_index = source_map.unwrap().0;
      let source_map = &source_map.unwrap().2;

      if let Some(token) = source_map.lookup_token(line - 1, col - 1) {
        if let Some(source) = token.get_source() {
          let (src_line, src_col) = token.get_src();
          frame.line = Some(src_line + 1);
          frame.col = Some(src_col + 1);
          if let Some(name) = token.get_name() {
            frame.name = name.to_string();
          }

          if !source.starts_with("http") {
            frame.sourced = true;
            let source_path = strip_source_path_prefix(source, &source_regex);

            if source_path.starts_with("webpack/") {
              frame.node_module = Some("(webpack)".to_string());
              frame.file = source_path.to_string();
            } else {
              frame.file = bundle_meta.to_relative_path(bundle_index, source_path);
              if frame.file.is_empty() {
                frame.node_module = Some("(unknown)".to_string());
              } else {
                let node_module = get_node_module(&frame.file);
                frame.node_module = if node_module.is_empty() {
                  None
                } else {
                  Some(node_module.to_owned())
                }
              }
            }
          }

          frame.key = frame.latest_key();
        }
      }
    });

    let webpack_require_frame_idx = profile
      .frames
      .iter()
      .position(|frame| &frame.name == "__webpack_require__");

    if let Some(webpack_require_frame_idx) = webpack_require_frame_idx {
      let frames = &mut profile.frames;
      let samples = &profile.samples;
      samples.iter().for_each(|sample| {
        let mut parent_is_webpack_require = false;
        for idx in sample {
          if idx == &webpack_require_frame_idx {
            parent_is_webpack_require = true
          } else if parent_is_webpack_require {
            let frame = frames.get_mut(*idx).unwrap();
            if let Some(mod_name) = bundle_meta.module_name_by_file(&frame.file, &frame.name) {
              frame.name = String::from("execute file");
              frame.file = mod_name.to_owned();
              frame.line = Some(1);
              frame.col = Some(1);
              frame.sourced = true;
              frame.update_key();
            }

            parent_is_webpack_require = false;
          }
        }
      });
    }
  }
  Ok(profile)
}

#[cfg(test)]
mod tests {
  use super::*;
  use expect_test::{expect, Expect};

  fn expect_eq<F>(f: F, input: &str, expect: Expect)
  where
    F: Fn(&str) -> &str,
  {
    let actual: String = input
      .split('\n')
      .filter_map(|row| {
        if row.is_empty() {
          None
        } else {
          Some(format!("{}\n", f(row)))
        }
      })
      .collect();
    expect.assert_eq(&actual)
  }

  #[test]
  fn get_node_module_correct() {
    expect_eq(
      get_node_module,
      r"
./some/path/index.js
./node_modules/name/esm/index.js
./node_modules/@namespace/name/esm/index.js
./node_modules/name/node_modules/name2/esm/index.js
./node_modules/@namespace/name/node_modules/name2/esm/index.js
./node_modules/@namespace/name/node_modules/@namespace/name2/esm/index.js
./node_modules/@semi/icons sync *
./node_modules/anymodule sync *
",
      expect![[r"

        name
        @namespace/name
        name2
        name2
        @namespace/name2
        @semi/icons sync *
        anymodule sync *
      "]],
    );
  }

  #[test]
  fn match_source_map_source() {
    let source_regex = Regex::new(SOURCE_REGEXP).unwrap();
    expect_eq(
      |row| {
        let path = strip_source_path_prefix(row, &source_regex);
        dbg!(&path);
        path
      },
      r"
webpack://perfsee/./packages/platform/index.tsx?md5hash
webpack://@namespace/perfsee/./packages/platform/index.tsx?md5hash
webpack:///./packages/platform/index.tsx
webpack:////path/to/module.js
webpack://webpack/runtime
webpack/runtime
/absolute/path/to/module.js
./relative/path/to/module.js
",
      expect![[r"
        ./packages/platform/index.tsx
        ./packages/platform/index.tsx
        ./packages/platform/index.tsx
        /path/to/module.js
        webpack/runtime
        webpack/runtime
        /absolute/path/to/module.js
        ./relative/path/to/module.js
      "]],
    )
  }

  #[test]
  fn recover_to_relative_path() {
    assert_eq!(
      to_relative_path("./a/b/c.js", "/build/perfsee", Some("packages/pkg")),
      "./packages/pkg/a/b/c.js"
    );
    assert_eq!(
      to_relative_path("a/b/c.js", "/build/perfsee", Some("packages/pkg")),
      "./packages/pkg/a/b/c.js"
    );
    assert_eq!(
      to_relative_path("a/b/c.js", "/build/perfsee", None),
      "./a/b/c.js"
    );
    assert_eq!(
      to_relative_path("/build/perfsee/a/b/c.js", "/build/perfsee", None),
      "./a/b/c.js"
    );
    assert_eq!(
      to_relative_path("/build/perfsee/a/b/c.js", "/build/perfsee", Some("a")),
      "./a/b/c.js"
    );
  }
}
