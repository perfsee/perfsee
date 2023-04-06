use std::collections::HashMap;

use super::Gatherer;

pub struct TimeUsingByScriptFile;

impl Gatherer for TimeUsingByScriptFile {
  fn new() -> Box<Self>
  where
    Self: Sized,
  {
    Box::new(TimeUsingByScriptFile)
  }

  fn analyse_profile(&self, ctx: &mut crate::analyzer::Context, profile: &crate::profile::Profile) {
    let mut script_time_using: HashMap<String, u32> = HashMap::new();

    profile.for_each_sample(|simple, weight| {
      if simple.is_empty() {
        return;
      }

      let frame = profile.frames.get(*simple.last().unwrap()).unwrap();

      if frame.origin_script_file.is_empty() {
        return;
      }

      if let Some(time) = script_time_using.get_mut(&frame.origin_script_file) {
        *time += weight;
      } else {
        script_time_using.insert(frame.origin_script_file.clone(), *weight);
      }
    });

    ctx.add_artifact(self.code(), script_time_using)
  }

  fn code(&self) -> &'static str {
    "time-using-by-script-file"
  }
}
