import { createRule } from '../utils';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

const PASCAL_CASE = /^[A-Z][a-zA-Z0-9]*$/;
const CAMEL_CASE = /^[a-z_$][a-zA-Z0-9$]*$/;
const UPPER_SNAKE_CASE = /^[A-Z][A-Z0-9_]+$/;

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

export default createRule({
  name: 'member-naming-convention',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce PascalCase for public class members and camelCase for private/protected',
    },
    messages: {
      publicShouldBePascal: 'Public member "{{ name }}" should be PascalCase.',
      privateShouldBeCamel: 'private member "{{ name }}" should be camelCase.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
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
        context.report({ node: node.key, messageId: 'publicShouldBePascal', data: { name } });
      }

      // Only enforce camelCase on private members — protected names are often
      // dictated by a base class and can't be detected without type info
      if (isPrivate(node) && !CAMEL_CASE.test(name)) {
        context.report({
          node: node.key,
          messageId: 'privateShouldBeCamel',
          data: { name },
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
