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
    return {
      TSEnumDeclaration(node) {
        const name =
          node.id?.type === AST_NODE_TYPES.Identifier ? node.id.name : 'Status';

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
