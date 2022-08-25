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

import { Type } from '@nestjs/common'
import { ObjectType, Field, InputType, Int, FieldMiddleware, MiddlewareContext, NextFn } from '@nestjs/graphql'

const parseCursorMiddleware: FieldMiddleware = async (_ctx: MiddlewareContext, next: NextFn) => {
  const value = await next()

  return value ? decode(value) : value
}

@InputType()
export class PaginationInput {
  @Field(() => Int, { nullable: true, description: 'returns the first n elements from the list.', defaultValue: 10 })
  first!: number
  @Field(() => Int, { nullable: true, description: 'ignore the first n elements from the list.', defaultValue: 0 })
  skip!: number
  @Field(() => String, {
    nullable: true,
    description: 'returns the elements in the list that come after the specified cursor.',
    middleware: [parseCursorMiddleware],
  })
  after!: string | null
}

const encode = (input: string) => Buffer.from(input).toString('base64')
const decode = (base64String: string) => Buffer.from(base64String, 'base64').toString('utf-8')

export function paginate<T>(
  list: T[],
  cursorField: keyof T,
  paginationInput: PaginationInput,
  total: number,
): PaginatedType<T> {
  const edges = list.map((item) => ({
    node: item,
    cursor: encode(String(item[cursorField])),
  }))

  return {
    edges,
    pageInfo: {
      totalCount: total,
      hasNextPage: edges.length >= paginationInput.first,
      endCursor: edges.length ? edges[edges.length - 1].cursor : null,
    },
  }
}

export interface PaginatedType<T> {
  edges: {
    cursor: string
    node: T
  }[]
  pageInfo: PageInfo
}

@ObjectType()
export class PageInfo {
  @Field(() => Int)
  totalCount!: number

  @Field()
  hasNextPage!: boolean

  @Field(() => String, { nullable: true })
  endCursor!: string | null
}

export function Paginated<T>(classRef: Type<T>): any {
  @ObjectType(`${classRef.name}Edge`)
  abstract class EdgeType {
    @Field(() => String)
    cursor!: string

    @Field(() => classRef)
    node!: T
  }

  @ObjectType({ isAbstract: true })
  abstract class PaginatedType {
    @Field(() => [EdgeType])
    edges!: EdgeType[]

    @Field(() => PageInfo)
    pageInfo!: PageInfo
  }

  return PaginatedType
}
