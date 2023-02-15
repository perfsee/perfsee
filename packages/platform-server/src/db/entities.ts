import { BaseEntity } from 'typeorm'

import * as models from './mysql'

export const mysqlEntities = Object.values(models).filter(
  (model) =>
    // @ts-expect-error
    model?.prototype instanceof BaseEntity,
) as typeof BaseEntity[]
