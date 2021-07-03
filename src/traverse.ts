import {
  visit,
  ASTNode,
  DirectiveNode,
  InlineFragmentNode,
  FieldNode,
  VariableDefinitionNode,
} from 'graphql';

export default function evaluateIncludeStatements(
  query: ASTNode,
  variables: Record<string, boolean>,
): ASTNode {
  function checkIncludeDirective(directive: DirectiveNode): boolean {
    const checkVar = (varName, value) => variables[varName] === value;

    const checkInclude = (d) =>
      d.kind === 'Directive' &&
      d.name.value === 'include' &&
      checkVar(d.arguments[0].value.name.value, false);

    const checkSkip = (d) =>
      d.kind === 'Directive' &&
      d.name.value === 'skip' &&
      checkVar(d.arguments[0].value.name.value, true);

    return checkInclude(directive) || checkSkip(directive);
  }

  function CleanSubTree(
    node: InlineFragmentNode | FieldNode,
  ): null | undefined {
    if (node.directives?.some(checkIncludeDirective)) {
      return null;
    }
  }

  function CleanVarDefinition(node: VariableDefinitionNode): null | undefined {
    if (Object.keys(variables).includes(node.variable.name.value)) {
      return null;
    }
  }

  return visit(query, {
    VariableDefinition: {
      enter: CleanVarDefinition,
    },
    InlineFragment: {
      enter: CleanSubTree,
    },
    Field: {
      enter: CleanSubTree,
    },
  });
}
