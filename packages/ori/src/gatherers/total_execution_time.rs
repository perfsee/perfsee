use super::Gatherer;

pub struct TotalExecutionTime;

impl Gatherer for TotalExecutionTime {
  fn new() -> Box<Self>
  where
    Self: Sized,
  {
    Box::new(TotalExecutionTime)
  }

  fn analyse_profile(&self, ctx: &mut crate::analyzer::Context, profile: &crate::profile::Profile) {
    let mut total_execution_time: u32 = 0;

    profile.for_each_sample(|simple, weight| {
      if simple.len() <= 1 {
        return;
      }

      total_execution_time += weight
    });

    ctx.add_artifact(self.code(), total_execution_time)
  }

  fn code(&self) -> &'static str {
    "total-execution-time"
  }
}
