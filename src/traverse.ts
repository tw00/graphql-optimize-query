import {
  visit,
  ASTNode,
  DirectiveNode,
  InlineFragmentNode,
  FieldNode,
  VariableDefinitionNode,
} from 'graphql';

enum TreeOperation {
  NOOP = 0,
  REMOVE = 1,
  KEEP = 2,
}

export default function evaluateIncludeStatements(
  query: ASTNode,
  variables: Record<string, boolean>,
): ASTNode {
  function checkDirective(directive: DirectiveNode): TreeOperation {
    const checkVar = (varName, value) => variables[varName] === value;

    const checkInclude = (d, v) =>
      d.kind === 'Directive' &&
      d.name.value === 'include' &&
      checkVar(d.arguments[0].value.name.value, v);

    const checkSkip = (d, v) =>
      d.kind === 'Directive' &&
      d.name.value === 'skip' &&
      checkVar(d.arguments[0].value.name.value, v);

    if (checkInclude(directive, false) || checkSkip(directive, true)) {
      return TreeOperation.REMOVE;
    }

    if (checkInclude(directive, true) || checkSkip(directive, false)) {
      return TreeOperation.KEEP;
    }

    return TreeOperation.NOOP;
  }

  function CleanSubTree<T extends InlineFragmentNode | FieldNode>(
    node: T,
  ): T | null | undefined {
    const operations = node.directives?.map(checkDirective) ?? [];
    const operationsWithoutNoop = operations.filter(
      (op) => op !== TreeOperation.NOOP,
    );

    if (
      operationsWithoutNoop.includes(TreeOperation.REMOVE) &&
      operationsWithoutNoop.includes(TreeOperation.KEEP)
    ) {
      throw new Error(
        'Operation can not have contradicting @include and @skip directives.',
      );
    }

    if (operationsWithoutNoop[0] === TreeOperation.REMOVE) {
      return null;
    }

    if (operationsWithoutNoop[0] === TreeOperation.KEEP) {
      return {
        ...node,
        directives: node.directives.filter(
          (_d, i) =>
            !(
              operations[i] === TreeOperation.REMOVE ||
              operations[i] === TreeOperation.KEEP
            ),
        ),
      };
    }
  }

  function CleanVarDefinition(
    node: VariableDefinitionNode,
  ): null | InlineFragmentNode | FieldNode | undefined {
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
