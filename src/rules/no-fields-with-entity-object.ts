import { createRule } from '../utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

export default createRule({
  name: 'no-fields-with-entity-object',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow Fields parameter when ResultType is "entity_object" — Fields is ignored by ProviderBase',
    },
    messages: {
      fieldsIgnored:
        'Fields is ignored when ResultType is "entity_object". ProviderBase overrides it with all fields. Remove Fields or use ResultType: "simple".',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ObjectExpression(node) {
        let hasFields = false;
        let hasEntityObject = false;

        for (const prop of node.properties) {
          if (prop.type !== AST_NODE_TYPES.Property || prop.key.type !== AST_NODE_TYPES.Identifier) continue;

          if (prop.key.name === 'Fields') hasFields = true;
          if (
            prop.key.name === 'ResultType' &&
            prop.value.type === AST_NODE_TYPES.Literal &&
            prop.value.value === 'entity_object'
          ) {
            hasEntityObject = true;
          }
        }

        if (hasFields && hasEntityObject) {
          context.report({ node, messageId: 'fieldsIgnored' });
        }
      },
    };
  },
});
