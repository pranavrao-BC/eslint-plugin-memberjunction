import { createRule } from '../utils';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

export default createRule<[], 'preferUnion' | 'suggestUnion'>({
  name: 'no-enum-prefer-union',
  meta: {
    type: 'suggestion',
    hasSuggestions: true,
    docs: {
      description: 'Prefer union types over enums for better tree-shaking and package exports',
    },
    messages: {
      preferUnion:
        "Use a union type instead of enum (e.g., `type {{ name }} = 'a' | 'b'`). Enums don't tree-shake well and cause issues with package exports.",
      suggestUnion: 'Convert to union type',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    /** Check if the enum is passed to registerEnumType() in the same file (TypeGraphQL requires real enums). */
    function isRegisteredWithTypeGraphQL(enumName: string): boolean {
      const sourceCode = context.sourceCode;
      const ast = sourceCode.ast;
      let found = false;

      function walk(node: TSESTree.Node): void {
        if (found) return;
        if (
          node.type === AST_NODE_TYPES.CallExpression &&
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === 'registerEnumType' &&
          node.arguments.length > 0 &&
          node.arguments[0].type === AST_NODE_TYPES.Identifier &&
          node.arguments[0].name === enumName
        ) {
          found = true;
          return;
        }
        for (const key of Object.keys(node)) {
          if (key === 'parent') continue;
          const child = (node as unknown as Record<string, unknown>)[key];
          if (child && typeof child === 'object') {
            if (Array.isArray(child)) {
              for (const item of child) {
                if (item && typeof item === 'object' && 'type' in item) {
                  walk(item as TSESTree.Node);
                }
              }
            } else if ('type' in child) {
              walk(child as TSESTree.Node);
            }
          }
        }
      }

      walk(ast as unknown as TSESTree.Node);
      return found;
    }

    return {
      TSEnumDeclaration(node) {
        const name =
          node.id?.type === AST_NODE_TYPES.Identifier ? node.id.name : 'Status';

        // TypeGraphQL requires real TS enums for registerEnumType() — skip these
        if (isRegisteredWithTypeGraphQL(name)) return;

        const body = (node as unknown as { body?: { members?: TSESTree.TSEnumMember[] } }).body;
        const members = body?.members ?? (node as unknown as { members: TSESTree.TSEnumMember[] }).members ?? [];
        const unionMembers = members.map((member) => {
          const memberName =
            member.id.type === AST_NODE_TYPES.Identifier ? member.id.name : String(member.id);
          if (!member.initializer) return `'${memberName}'`;
          if (member.initializer.type === AST_NODE_TYPES.Literal) {
            const val = member.initializer.value;
            return typeof val === 'string' ? `'${val}'` : String(val);
          }
          return context.sourceCode.getText(member.initializer);
        });

        context.report({
          node,
          messageId: 'preferUnion',
          data: { name },
          suggest: unionMembers.length > 0
            ? [{
                messageId: 'suggestUnion' as const,
                fix: (fixer) => {
                  const exportPrefix = context.sourceCode.getText(node).startsWith('export') ? 'export ' : '';
                  const constPrefix = context.sourceCode.getText(node).includes('const enum') ? '' : '';
                  return fixer.replaceText(
                    node,
                    `${exportPrefix}${constPrefix}type ${name} = ${unionMembers.join(' | ')};`,
                  );
                },
              }]
            : [],
        });
      },
    };
  },
});
