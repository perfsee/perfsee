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
import { Stack } from '@fluentui/react'
import { Components } from '@mdx-js/react/lib/index'
import { AnchorHTMLAttributes, DetailedHTMLProps } from 'react'

const MDXUL = styled.ul({})

const MDXInlineCode = styled.code(({ theme }) => ({
  color: theme.markdown.inlineCode.color,
  backgroundColor: theme.markdown.inlineCode.background,
}))

const MDXWrapper = styled(Stack)({
  [`${MDXUL}`]: {
    listStyleType: 'disc',
    paddingLeft: '20px',
  },
})

const MarkdownLink = styled.a({
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
})

const MDXA = (props: DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>) => {
  return <MarkdownLink {...props} target="_blank" rel="noopener" />
}

const MDXBlockQuote = styled.blockquote(({ theme }) => ({
  backgroundColor: theme.markdown.blockquote.backgroundColor,
  color: theme.markdown.blockquote.color,
  padding: '10px 15px',
}))

export const MDXComponents: Components = {
  ul: MDXUL,
  code: MDXInlineCode,
  wrapper: MDXWrapper,
  a: MDXA,
  blockquote: MDXBlockQuote,
}
