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

import { Field, InputType, OmitType, PartialType } from '@nestjs/graphql'

import { Environment, LocalStorageType, HeaderType, CookieType } from '@perfsee/platform-server/db'

@InputType()
export class LocalStorageInputType extends OmitType(LocalStorageType, [], InputType) {}

@InputType()
export class HeaderInputType extends OmitType(HeaderType, [], InputType) {}

@InputType()
export class CookieInputType extends OmitType(CookieType, [], InputType) {}

@InputType()
export class UpdateEnvironmentInput extends PartialType(
  OmitType(Environment, ['id', 'projectId', 'localStorage', 'cookies', 'headers']),
  InputType,
) {
  @Field(() => [LocalStorageInputType], { nullable: true })
  localStorage?: LocalStorageInputType[]

  @Field(() => [CookieInputType], { nullable: true })
  cookies?: CookieInputType[]

  @Field(() => [HeaderInputType], { nullable: true })
  headers?: HeaderInputType[]
}
