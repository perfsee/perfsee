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

use std::path::{Component, Path, PathBuf};

pub fn join<P: AsRef<Path>>(paths: Vec<P>) -> PathBuf {
  let mut builder = PathBuf::new();

  for path in paths {
    let path = path.as_ref();
    for part in path.components() {
      match part {
        Component::RootDir => {
          builder.clear();
          builder.push("/");
        }
        Component::ParentDir => {
          let cur = builder.as_os_str();
          if cur.is_empty() {
            builder.push("../")
          } else {
            match builder.components().last().unwrap() {
              Component::Normal(..) => {
                builder.pop();
              }
              Component::ParentDir => {
                builder.push("../");
              }
              Component::CurDir => {
                builder.pop();
                builder.push("../");
              }
              _ => {}
            }
          }
        }
        Component::Normal(path) if !path.is_empty() => {
          builder.push(path);
        }
        Component::CurDir => {
          if builder.as_os_str().is_empty() {
            builder.push("./")
          }
        }
        _ => {}
      }
    }
  }

  builder
}

macro_rules! join {
  ( $paths:expr ) => {
    $crate::utils::path::join($paths)
  };
  ( $base_path:expr, $( $path:expr ),+ ) => {
    $crate::utils::path::join(vec![$base_path, $($path),+])
  };
}

#[cfg(test)]
#[macro_use]
mod tests {
  #[test]
  fn join() {
    fn expect_path_eq(input: &str) {
      for row in input.split('\n') {
        let row = row.trim();
        let mut paths: Vec<_> = row
          .split(',')
          .map(|s| s.trim_matches(|c| c == ' ' || c == '\''))
          .collect();

        let target = paths.pop().unwrap();

        assert_eq!(join!(paths).as_os_str(), target, "\njoin args: {}", row);
      }
    }

    expect_path_eq(
      r#"
        '.', 'x/b', '..', '/b/c.js', '/b/c.js'
        '/.', 'x/b', '..', '/b/c.js', '/b/c.js'
        '/foo', '../../../bar', '/bar'
        'foo', '../../../bar', '../../bar'
        'foo/', '../../../bar', '../../bar'
        'foo/x', '../../../bar', '../bar'
        'foo/x', './bar', 'foo/x/bar'
        'foo/x/', './bar', 'foo/x/bar'
        'foo/x/', '.', 'bar', 'foo/x/bar'
        './', './'
        '.', './', './'
        '.', '.', '.', './'
        '.', './', '.', './'
        '.', '/./', '.', '/'
        '.', '/////./', '.', '/'
        '.', './'
        '', '.', './'
        '', 'foo', 'foo'
        'foo', '/bar', '/bar'
        '', '/foo', '/foo'
        '', '', '/foo', '/foo'
        '', '', 'foo', 'foo'
        'foo', '', 'foo'
        'foo/', '', 'foo'
        'foo', '', '/bar', '/bar'
        './', '..', '/foo', '/foo'
        './', '..', '..', '/foo', '/foo'
        '.', '..', '..', '/foo', '/foo'
        '', '..', '..', '/foo', '/foo'
        '/', '/'
        '/', '.', '/'
        '/', '..', '/'
        '/', '..', '..', '/'
        '', ''
        '', '', ''
        ' /foo', '/foo'
        ' ', 'foo', 'foo'
        ' ', '.', './'
        ' ', '/', '/'
        ' ', '', ''
        '/', 'foo', '/foo'
        '/', '/foo', '/foo'
        '/', '//foo', '/foo'
        '/', '', '/foo', '/foo'
        '', '/', 'foo', '/foo'
        '', '/', '/foo', '/foo'
      "#,
    )
  }
}
