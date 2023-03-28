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

import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql'

@InputType()
export class CreateGroupInput {
  @Field(() => String)
  id!: string

  @Field(() => [String], { description: 'project slug' })
  projectIds!: string[]
}

@ObjectType()
export class ScoreItem {
  @Field(() => Int, { nullable: true })
  minScore!: number

  @Field(() => Int, { nullable: true })
  maxScore!: number

  @Field(() => Float, { nullable: true })
  averageScore!: number
}

// there are keys of MetricType
@ObjectType()
export class AvgMetricType {
  @Field(() => Float, { nullable: true, description: 'performance score' })
  score!: number

  @Field(() => Float, { nullable: true })
  FCP!: number

  @Field(() => Float, { nullable: true })
  FMP!: number

  @Field(() => Float, { nullable: true })
  LCP!: number

  @Field(() => Float, { nullable: true })
  SI!: number

  @Field(() => Float, { nullable: true })
  TBT!: number

  @Field(() => Float, { nullable: true })
  TTI!: number

  @Field(() => Float, { nullable: true })
  MPFID!: number

  @Field(() => Float, { nullable: true })
  CLS!: number

  @Field(() => Float, { nullable: true })
  WS!: number
}
