import { createRule } from '../utils';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

const PASCAL_CASE = /^[A-Z][a-zA-Z0-9]*$/;
const CAMEL_CASE = /^[a-z_$][a-zA-Z0-9$]*$/;
const UPPER_SNAKE_CASE = /^[A-Z][A-Z0-9_]+$/;

/** Convert a name to PascalCase: "userName" → "UserName", "user_name" → "UserName" */
function toPascalCase(name: string): string {
  return name
    .replace(/^_+/, '')
    .replace(/(^|[_-])([a-z])/g, (_, _sep, c: string) => c.toUpperCase())
    .replace(/^([a-z])/, (_, c: string) => c.toUpperCase());
}

/** Convert a name to camelCase: "UserName" → "userName", "User_Name" → "userName" */
function toCamelCase(name: string): string {
  const pascal = toPascalCase(name);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// Angular lifecycle hooks and known framework methods that must be camelCase
const FRAMEWORK_METHODS = new Set([
  'ngOnInit', 'ngOnDestroy', 'ngOnChanges', 'ngDoCheck',
  'ngAfterContentInit', 'ngAfterContentChecked',
  'ngAfterViewInit', 'ngAfterViewChecked',
  'constructor',
]);

function getMemberName(node: TSESTree.PropertyDefinition | TSESTree.MethodDefinition): string | null {
  if (node.key.type === AST_NODE_TYPES.Identifier) return node.key.name;
  return null;
}

function isPublic(node: TSESTree.PropertyDefinition | TSESTree.MethodDefinition): boolean {
  return node.accessibility === 'public' || node.accessibility == null;
}

function isPrivate(node: TSESTree.PropertyDefinition | TSESTree.MethodDefinition): boolean {
  return node.accessibility === 'private';
}

function isOverrideOrAbstract(node: TSESTree.PropertyDefinition | TSESTree.MethodDefinition): boolean {
  return node.override === true || ('abstract' in node && (node as { abstract?: boolean }).abstract === true);
}

type Options = [{
  excludePaths?: string[];
}];

export default createRule<Options, 'publicShouldBePascal' | 'privateShouldBeCamel'>({
  name: 'member-naming-convention',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce PascalCase for public class members and camelCase for private',
    },
    messages: {
      publicShouldBePascal: 'Public member `{{ name }}` should be PascalCase (e.g., `{{ name }}` → `{{ expected }}`). MJ uses PascalCase for all public class members to match generated entity classes.',
      privateShouldBeCamel: 'Private member `{{ name }}` should be camelCase (e.g., `{{ name }}` → `{{ expected }}`). MJ uses camelCase for private/protected members.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          excludePaths: {
            type: 'array',
            items: { type: 'string' },
            description: 'Path substrings to exclude (e.g., "React/", "AICLI/", "A2AServer/"). Files matching any pattern are skipped.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const excludePaths = options.excludePaths ?? [];
    if (excludePaths.some((p) => context.filename.includes(p))) return {};

    function check(node: TSESTree.PropertyDefinition | TSESTree.MethodDefinition) {
      const name = getMemberName(node);
      if (!name || name.startsWith('_') || FRAMEWORK_METHODS.has(name)) return;

      // Skip decorated properties (@Input/@Output — naming dictated by template bindings)
      if (node.decorators?.length) return;

      // Skip override methods — name is dictated by parent class
      if (isOverrideOrAbstract(node)) return;

      // Skip UPPER_SNAKE_CASE — conventional for constants regardless of visibility
      if (UPPER_SNAKE_CASE.test(name)) return;

      if (isPublic(node) && !node.static && !PASCAL_CASE.test(name)) {
        context.report({ node: node.key, messageId: 'publicShouldBePascal', data: { name, expected: toPascalCase(name) } });
      }

      // Only enforce camelCase on private members — protected names are often
      // dictated by a base class and can't be detected without type info
      if (isPrivate(node) && !CAMEL_CASE.test(name)) {
        context.report({
          node: node.key,
          messageId: 'privateShouldBeCamel',
          data: { name, expected: toCamelCase(name) },
        });
      }
    }

    return {
      PropertyDefinition: check,
      MethodDefinition(node) {
        if (node.kind === 'constructor') return;
        check(node);
      },
    };
  },
});
