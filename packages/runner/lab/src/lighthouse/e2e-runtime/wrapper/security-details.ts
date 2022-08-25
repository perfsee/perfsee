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

import { SecurityDetails } from 'puppeteer-core'

import { createWrapper } from './wrapper'

// https://github.com/puppeteer/puppeteer/blob/v11.0.0/docs/api.md#class-securitydetails
export const securityDetailsWrapper = createWrapper<SecurityDetails>('SecurityDetails', (securityDetails, _) => {
  return {
    issuer: () => securityDetails.issuer(),
    protocol: () => securityDetails.protocol(),
    subjectAlternativeNames: () => securityDetails.subjectAlternativeNames(),
    subjectName: () => securityDetails.subjectName(),
    validFrom: () => securityDetails.validFrom(),
    validTo: () => securityDetails.validTo(),
  }
})
