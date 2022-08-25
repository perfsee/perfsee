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

import { DefaultNamingStrategy, Table } from 'typeorm'
import { snakeCase } from 'typeorm/util/StringUtils'

export class SnakeNamingStrategy extends DefaultNamingStrategy {
  tableName(className: string, customName: string) {
    return customName ? customName : snakeCase(className)
  }

  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]) {
    return snakeCase(embeddedPrefixes.join('_')) + (customName ? customName : snakeCase(propertyName))
  }

  relationName(propertyName: string) {
    return snakeCase(propertyName)
  }

  joinColumnName(relationName: string, referencedColumnName: string) {
    return snakeCase(relationName + '_' + referencedColumnName)
  }

  joinTableName(
    firstTableName: string,
    secondTableName: string,
    firstPropertyName: string,
    _secondPropertyName: string,
  ) {
    return snakeCase(firstTableName + '_' + firstPropertyName.replace(/\./gi, '_') + '_' + secondTableName)
  }

  joinTableColumnName(tableName: string, propertyName: string, columnName: string) {
    return snakeCase(tableName + '_' + (columnName ? columnName : propertyName))
  }

  classTableInheritanceParentColumnName(parentTableName: string, parentTableIdPropertyName: string) {
    return snakeCase(parentTableName + '_' + parentTableIdPropertyName)
  }

  eagerJoinRelationAlias(alias: string, propertyPath: string) {
    return alias + '__' + propertyPath.replace('.', '_')
  }

  indexName(tableOrName: string, columns: string[], where?: string) {
    const name = super.indexName(tableOrName, columns, where)
    return name.toLowerCase()
  }

  relationConstraintName(tableOrName: string | Table, columns: string[], where?: string) {
    const name = super.relationConstraintName(tableOrName, columns, where)
    return `uniq_${name.toLowerCase()}`
  }

  uniqueConstraintName(tableOrName: string | Table, columns: string[]) {
    const name = super.uniqueConstraintName(tableOrName, columns)
    return `uniq_${name.toLowerCase()}`
  }
}
