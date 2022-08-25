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

import { BaseEntity, DeepPartial } from 'typeorm'

type ConstructorOf<T> = {
  new (): T
}

export const entityFactories = {}

/**
 * @example
 *
 * registerEntityFactory(() => User.create({}))
 */
export function registerEntityFactory<T>(entityClass: ConstructorOf<T>, factory: () => T) {
  entityFactories[entityClass.name] = factory
}

export function getEntityFactory<Entity>(
  entityClass: ConstructorOf<Entity>,
): undefined | ((dep?: DeepPartial<Entity>) => Entity) {
  return entityFactories[entityClass.name]
}

export async function create<Entity extends BaseEntity>(
  entityClass: ConstructorOf<Entity> & typeof BaseEntity,
  init?: DeepPartial<Entity>,
): Promise<Entity>
export async function create<Entity extends BaseEntity>(
  entityClass: ConstructorOf<Entity> & typeof BaseEntity,
  init?: DeepPartial<Entity>[],
): Promise<Entity[]>
export async function create<Entity extends BaseEntity>(
  entityClass: ConstructorOf<Entity> & typeof BaseEntity,
  init?: DeepPartial<Entity>[] | DeepPartial<Entity>,
) {
  // create from fixture
  const factory = getEntityFactory<Entity>(entityClass)
  const createEntity = (init?: DeepPartial<Entity>) => {
    let entity = factory ? factory() : entityClass.create<Entity>()
    if (init) {
      entity = entityClass.merge<Entity>(entity, init)
    }
    return entity
  }

  if (Array.isArray(init)) {
    return entityClass.save<Entity>(init.map((i) => createEntity(i)))
  }

  return entityClass.save<Entity>(createEntity(init))
}
