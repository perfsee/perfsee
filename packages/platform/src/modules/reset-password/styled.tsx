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

import styled from '@emotion/styled'
import { PrimaryButton } from '@fluentui/react'

import { Card } from '@perfsee/components'

export const FormContainer = styled(Card)({
  width: 550,
  margin: '80px 0',
  padding: '64px 88px',
})

export const BlockButton = styled(PrimaryButton)({
  width: '100%',
})
