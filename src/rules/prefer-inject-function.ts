import { createRule } from '../utils';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

/** Check if a class has any Angular decorator (@Component, @Directive, @Injectable, @Pipe). */
function hasAngularDecorator(node: TSESTree.ClassDeclaration | TSESTree.ClassExpression): boolean {
  if (!node.decorators?.length) return false;
  return node.decorators.some((d) => {
    const expr = d.expression;
    // @Component({...}) — CallExpression with Identifier callee
    if (
      expr.type === AST_NODE_TYPES.CallExpression &&
      expr.callee.type === AST_NODE_TYPES.Identifier
    ) {
      return ['Component', 'Directive', 'Injectable', 'Pipe'].includes(expr.callee.name);
    }
    // @Injectable — bare Identifier (no parens)
    if (expr.type === AST_NODE_TYPES.Identifier) {
      return ['Component', 'Directive', 'Injectable', 'Pipe'].includes(expr.name);
    }
    return false;
  });
}

/** Check if a constructor parameter is a DI injection (has a type annotation that looks like a service). */
function isInjectedParam(param: TSESTree.Parameter): boolean {
  // constructor(private foo: FooService) — has accessibility modifier and type annotation
  if (
    param.type === AST_NODE_TYPES.TSParameterProperty &&
    param.parameter.type === AST_NODE_TYPES.Identifier &&
    param.parameter.typeAnnotation
  ) {
    return true;
  }
  return false;
}

export default createRule({
  name: 'prefer-inject-function',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer inject() function over constructor parameter injection in Angular components',
    },
    messages: {
      preferInject:
        'Use `{{name}} = inject({{type}})` instead of constructor injection. The inject() function is more concise and works with standalone components.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ClassDeclaration(node) {
        if (!hasAngularDecorator(node)) return;
        checkConstructor(node);
      },
      ClassExpression(node) {
        if (!hasAngularDecorator(node)) return;
        checkConstructor(node);
      },
    };

    function checkConstructor(node: TSESTree.ClassDeclaration | TSESTree.ClassExpression) {
      const ctor = node.body.body.find(
        (member): member is TSESTree.MethodDefinition =>
          member.type === AST_NODE_TYPES.MethodDefinition && member.kind === 'constructor',
      );
      if (!ctor) return;

      const params = ctor.value.params;
      for (const param of params) {
        if (!isInjectedParam(param)) continue;

        const tsParam = param as TSESTree.TSParameterProperty;
        const id = tsParam.parameter as TSESTree.Identifier;
        const name = id.name;

        // Extract type name
        const typeAnn = id.typeAnnotation?.typeAnnotation;
        const typeName =
          typeAnn?.type === AST_NODE_TYPES.TSTypeReference &&
          typeAnn.typeName.type === AST_NODE_TYPES.Identifier
            ? typeAnn.typeName.name
            : null;

        context.report({
          node: param,
          messageId: 'preferInject',
          data: { name, type: typeName ?? 'Service' },
        });
      }
    }
  },
});
