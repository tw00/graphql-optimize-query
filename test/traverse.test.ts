import { print } from 'graphql';
import gql from 'graphql-tag';
import evaluateIncludeStatements from '../src/traverse';

describe('test evaluateIncludeStatements', (): void => {
  test('include', (): void => {
    const testQuery = gql`
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

    const ref = gql`
      query GetUser($userID: ID!) {
        user(id: $userID) {
          other
        }
      }
    `;

    const result = evaluateIncludeStatements(testQuery, { auth: false });
    expect(print(result)).toBe(print(ref));
  });

  test('skip', (): void => {
    const testQuery = gql`
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

    const ref = gql`
      query GetUser($userID: ID!) {
        user(id: $userID) {
          other
        }
      }
    `;

    const result = evaluateIncludeStatements(testQuery, { noAuth: true });
    expect(print(result)).toBe(print(ref));
  });
});
