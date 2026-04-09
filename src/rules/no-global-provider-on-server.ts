import { createRule } from '../utils';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

/**
 * Flags server-side code that uses the global Metadata/RunView provider
 * instead of threading the request-scoped provider.
 *
 * On the server, each inbound request gets its own database connection with
 * its own authenticated user context. Using the global provider means wrong
 * permissions, potential data leakage between requests, and race conditions.
 *
 * Flagged:
 *  - `new RunView()` with no constructor argument (falls back to global)
 *  - `Metadata.Provider` / `RunView.Provider` reads (accessing the global)
 *
 * Not flagged:
 *  - `new RunView(provider)` — provider passed to constructor
 *  - `Metadata.Provider = ...` — initialization/assignment is fine
 *
 * Scope this rule to server-side packages in your ESLint config using the
 * `files` key — it should not apply to Angular/client code where the
 * global provider is correct.
 */

export default createRule({
  name: 'no-global-provider-on-server',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require request-scoped providers instead of global Metadata/RunView singletons in server-side code',
    },
    messages: {
      noProviderRunView:
        'Pass the request-scoped provider to the RunView constructor: `new RunView(provider)`. Without it, RunView falls back to the global provider which is not request-safe on the server.',
      noGlobalProviderAccess:
        'Do not read the global `{{ className }}.Provider` — use the request-scoped provider from the resolver context or `ExecuteAgentParams.provider`.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      NewExpression(node) {
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === 'RunView' &&
          node.arguments.length === 0
        ) {
          context.report({ node, messageId: 'noProviderRunView' });
        }
      },

      MemberExpression(node) {
        if (
          !node.computed &&
          node.object.type === AST_NODE_TYPES.Identifier &&
          (node.object.name === 'Metadata' || node.object.name === 'RunView') &&
          node.property.type === AST_NODE_TYPES.Identifier &&
          node.property.name === 'Provider'
        ) {
          // Allow assignment TO the provider (initialization)
          const parent = node.parent;
          if (
            parent?.type === AST_NODE_TYPES.AssignmentExpression &&
            parent.left === node
          ) {
            return;
          }

          context.report({
            node,
            messageId: 'noGlobalProviderAccess',
            data: { className: (node.object as TSESTree.Identifier).name },
          });
        }
      },

    };
  },
});
