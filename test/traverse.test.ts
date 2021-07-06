import { print } from 'graphql';
import gql from 'graphql-tag';
import evaluateIncludeStatements from '../src/traverse';

const testQueryBasic = gql`
  query Test($enable: Boolean!) {
    test {
      field @include(if: $enable)
      nested @include(if: $enable) {
        field
      }
      ... on Type @include(if: $enable) {
        typeField
      }
      unrelated1 @unrelated
      unrelated2 @unrelated @skip(if: $enable)
    }
  }
`;

const testQueryInclude = gql`
  query GetUser($userID: ID!, $auth: Boolean!) {
    user(id: $userID) {
      name @include(if: $auth) {
        firstName
        lastName
      }
      ... on Asset @include(if: $auth) {
        data
      }
      other
    }
  }
`;

const testQuerySkip = gql`
  query GetUser($userID: ID!, $noAuth: Boolean!) {
    user(id: $userID) {
      name @skip(if: $noAuth) {
        firstName
        lastName
      }
      ... on Asset @skip(if: $noAuth) {
        data
      }
      other
    }
  }
`;

describe('test evaluateIncludeStatements', (): void => {
  test('basic test', (): void => {
    const ref = gql`
      query Test {
        test {
          unrelated1 @unrelated
          unrelated2 @unrelated
        }
      }
    `;

    const result = evaluateIncludeStatements(testQueryBasic, { enable: false });
    expect(print(result)).toBe(print(ref));
  });

  test('include (removing)', (): void => {
    const ref = gql`
      query GetUser($userID: ID!) {
        user(id: $userID) {
          other
        }
      }
    `;

    const result = evaluateIncludeStatements(testQueryInclude, { auth: false });
    expect(print(result)).toBe(print(ref));
  });

  test('include (keeping)', (): void => {
    const ref = gql`
      query GetUser($userID: ID!) {
        user(id: $userID) {
          name {
            firstName
            lastName
          }
          ... on Asset {
            data
          }
          other
        }
      }
    `;

    const result = evaluateIncludeStatements(testQueryInclude, { auth: true });
    expect(print(result)).toBe(print(ref));
  });

  test('skip', (): void => {
    const ref = gql`
      query GetUser($userID: ID!) {
        user(id: $userID) {
          other
        }
      }
    `;

    const result = evaluateIncludeStatements(testQuerySkip, { noAuth: true });
    expect(print(result)).toBe(print(ref));
  });

  test('contradiction 1', () => {
    const testQueryInvalid = gql`
      query GetUser($userID: ID!, $auth: Boolean!, $noAuth: Boolean!) {
        user(id: $userID) {
          name @include(if: $auth) @include(if: $noAuth) {
            foobar
          }
        }
      }
    `;

    expect(() => {
      evaluateIncludeStatements(testQueryInvalid, {
        auth: true,
        noAuth: false,
      });
    }).toThrowError();
  });

  test('contradiction 2', () => {
    const testQueryInvalid = gql`
      query GetUser($userID: ID!, $auth: Boolean!) {
        user(id: $userID) {
          name @include(if: $auth) @skip(if: $auth) {
            foobar
          }
        }
      }
    `;

    expect(() => {
      evaluateIncludeStatements(testQueryInvalid, {
        auth: true,
      });
    }).toThrowError();
  });
});
