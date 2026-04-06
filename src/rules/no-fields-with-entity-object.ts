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
    function getKeyName(prop: import('@typescript-eslint/utils').TSESTree.Property): string | null {
      if (prop.key.type === AST_NODE_TYPES.Identifier) return prop.key.name;
      if (prop.key.type === AST_NODE_TYPES.Literal && typeof prop.key.value === 'string') return prop.key.value;
      return null;
    }

    function isEntityObjectValue(value: import('@typescript-eslint/utils').TSESTree.Expression): boolean {
      if (value.type === AST_NODE_TYPES.Literal && value.value === 'entity_object') return true;
      // Handle template literal: `entity_object`
      if (
        value.type === AST_NODE_TYPES.TemplateLiteral &&
        value.quasis.length === 1 &&
        value.expressions.length === 0 &&
        value.quasis[0].value.cooked === 'entity_object'
      ) return true;
      return false;
    }

    return {
      ObjectExpression(node) {
        let hasFields = false;
        let hasEntityObject = false;

        for (const prop of node.properties) {
          if (prop.type !== AST_NODE_TYPES.Property) continue;

          const keyName = getKeyName(prop);
          if (!keyName) continue;

          if (keyName === 'Fields') hasFields = true;
          if (keyName === 'ResultType' && isEntityObjectValue(prop.value as import('@typescript-eslint/utils').TSESTree.Expression)) {
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
