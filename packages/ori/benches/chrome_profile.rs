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

use criterion::{criterion_group, criterion_main, Criterion};
use ori::profile::chrome_profile::load_chrome_profile;
use ori::profile::Profile;
use std::convert::TryFrom;
use std::env::current_dir;
use std::path::PathBuf;

pub fn get_sample_path(path: &str) -> PathBuf {
  current_dir().unwrap().join("sample").join(path)
}

fn chrome_profile_benchmark(c: &mut Criterion) {
  let chrome_profiles = load_chrome_profile(get_sample_path("chrome/worker.sample")).unwrap();

  c.bench_function("chrome profile", |b| {
    b.iter(|| {
      chrome_profiles
        .clone()
        .into_iter()
        .map(|chrome_profile| Profile::try_from(chrome_profile).unwrap())
        .collect::<Vec<Profile>>()
    })
  });
}

criterion_group!(benches, chrome_profile_benchmark);
criterion_main!(benches);
