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

import { NeutralColors } from '@perfsee/dls'

export const ExportAnalysisContainer = styled.section(({ theme }) => ({
  marginTop: 24,
  display: 'flex',
  height: 'auto',
  flexDirection: 'column',
  borderRadius: theme.border.radius,
  border: `1px solid ${theme.border.color}`,
  padding: '12px 16px',
  width: '100%',
  position: 'relative',
}))

export const ExportAnalysisTopBar = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`

export const ExportAnalysisSubtext = styled.p`
  text-align: center;
  max-width: 850px;
  line-height: 1.5;
  margin: 10px auto 0;
`

export const ExportAnalysisInfoText = styled(ExportAnalysisSubtext)`
  margin-top: -15px;
  color: ${NeutralColors.gray120};
`

export const InputContainer = styled.div`
  position: absolute;
  margin-right: auto;
  right: 0;
`

export const FilterInput = styled.input`
  padding-right: 30px;
  width: 7vw;
  transition: all 0.1s ease-in-out;
  will-change: transform;
  contain: strict;
  border: 1px solid ${NeutralColors.gray40};
  background: ${NeutralColors.gray10};

  &:focus {
    width: 10vw;
    background: white;
    border: 1px solid ${NeutralColors.gray60};
  }
`

export const SearchIcon = styled.svg`
  position: absolute;
  right: 10px;
  z-index: 1;
  top: 0;
  bottom: 5px;
  margin: auto;
  width: 15px;
  height: 15px;

  path {
    stroke: #666;
    stroke-width: 3px;
  }
`

export const SectionList = styled.ul`
  overflow-y: scroll;
  height: 100%;
  background-image: /* Shadows */ linear-gradient(to right, white, white), linear-gradient(to right, white, white),
    /* Shadow covers */ linear-gradient(to right, rgba(30, 30, 30, 0.08), rgba(255, 255, 255, 0)),
    linear-gradient(to left, rgba(30, 30, 30, 0.08), rgba(255, 255, 255, 0));

  background-position: left center, right center, left center, right center;
  background-repeat: no-repeat;
  background-size: 2vw 100%, 2vw 100%, 1vw 100%, 1vw 100%;

  background-attachment: local, local, scroll, scroll;
  position: relative;
  column-width: 250px;
  column-gap: 10px;
  padding: 0;
  max-height: 80vh;
  margin: 0;
  list-style-type: none;
  overflow-y: scroll;
  height: 100%;
  margin-top: 30px;
`
export const DontBreak = styled.div`
  page-break-inside: avoid;
  break-inside: avoid;
`

export const LetterHeading = styled.h3`
  font-size: 1.35rem;
  margin: 15px 0 10px;
`

export const SectionPill = styled.li`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding: 10px;
  margin-top: 0;
  margin-bottom: 0;
  position: relative;
  z-index: 0;
  page-break-inside: avoid;
  break-inside: avoid;

  &::after {
    content: '';
    background: ${NeutralColors.gray10};
    position: absolute;
    bottom: 0;
    height: 1px;
    width: 100%;
    left: 0;
    z-index: -2;
  }
`

export const SectionPillFill = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  border-radius: inherit;
  z-index: -1;
  width: 100%;
  transition: transform 0.4s cubic-bezier(0.635, 0.1, 0, 1.34);
  transform-origin: 0 50%;
`

export const PillName = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
`

export const SizeUnit = styled.span`
  color: ${NeutralColors.gray90};
  font-size: 90%;
  margin-left: 2px;
`
