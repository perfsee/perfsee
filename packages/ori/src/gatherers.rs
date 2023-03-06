use crate::{analyzer::Context, profile::Profile};

pub mod time_using_by_script_file;
pub mod total_execution_time;

pub trait Gatherer {
  fn new() -> Box<Self>
  where
    Self: Sized;
  fn analyse_profile(&self, ctx: &mut Context, profile: &Profile);
  fn code(&self) -> &'static str;
  fn desc(&self) -> &'static str {
    ""
  }
}

pub fn get_all_gatherers() -> Vec<Box<dyn Gatherer>> {
  vec![
    time_using_by_script_file::TimeUsingByScriptFile::new(),
    total_execution_time::TotalExecutionTime::new(),
  ]
}
