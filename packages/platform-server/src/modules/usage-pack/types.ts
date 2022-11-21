import { Field, InputType, PartialType, PickType } from '@nestjs/graphql'

import { UsagePack } from '@perfsee/platform-server/db'

@InputType()
export class CreateUsagePackInput extends PickType(
  UsagePack,
  ['name', 'isPublic', 'jobCountMonthly', 'jobDurationMonthly', 'storage', 'desc'],
  InputType,
) {}

@InputType()
export class UpdateUsagePackInput extends PartialType(CreateUsagePackInput, InputType) {
  @Field()
  id!: number
}
