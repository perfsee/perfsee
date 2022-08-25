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

const ts = require('typescript')

/**
 * @type {import('typescript').TransformerFactory<import('typescript').SourceFile>}
 */
module.exports.cypressTransformer = function cypressTransformer(context) {
  /**
   * @type {import('typescript').Visitor}
   */
  const visitor = (node) => {
    if (ts.isSourceFile(node)) {
      return ts.visitEachChild(node, visitor, context)
    }

    const jsDoc = node.jsDoc

    if (jsDoc && Array.isArray(jsDoc)) {
      let cypress
      let declarationName
      jsDoc.forEach((jsDocNode) => {
        try {
          const tags = jsDocNode.tags.filter((tag) => tag.tagName.text === 'cypress')
          if (tags.length) {
            const [tag] = tags
            cypress = tag.comment
          }
          // eslint-disable-next-line no-empty
        } catch {}
      })
      try {
        const [declaration] = node.declarationList.declarations
        if (declaration?.name) {
          declarationName = declaration.name.text
        }
        // eslint-disable-next-line no-empty
      } catch {}
      if (cypress && declarationName) {
        const expression = context.factory.createExpressionStatement(
          context.factory.createBinary(
            context.factory.createPropertyAccess(
              context.factory.createIdentifier(declarationName),
              context.factory.createIdentifier('defaultProps'),
            ),
            ts.SyntaxKind.EqualsToken,
            context.factory.createObjectLiteral([
              context.factory.createSpreadAssignment(
                context.factory.createPropertyAccess(
                  context.factory.createIdentifier(declarationName),
                  context.factory.createIdentifier('defaultProps'),
                ),
              ),
              context.factory.createPropertyAssignment(
                context.factory.createStringLiteral('data-cypress'),
                context.factory.createStringLiteral(cypress),
              ),
            ]),
          ),
        )
        return [node, expression]
      }
      return node
    }
    return ts.visitEachChild(node, visitor, context)
  }

  return (node) => ts.visitNode(node, visitor)
}
