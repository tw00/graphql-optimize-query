# graphql-optimize-query

[![npm version](https://badge.fury.io/js/graphql-optimize-query.svg)](https://badge.fury.io/js/graphql-optimize-query)

A lightweight library to optimize graphql queries by evaluating `@include` and `@skip` directives client-side.

# Usage

Install graphql-optimize-query from npm with:

```bash
npm install graphql-optimize-query
```

Import with:

```js
const { optimizeQuery } = require('graphql-optimize-query')
// or
import { optimizeQuery } from 'graphql-optimize-query';
```

## Example

```js
const { print } = require('graphql');
const gql = require('graphql-tag');
const { optimizeQuery } = require('graphql-optimize-query');

const query = gql`
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

const editedAST = optimizeQuery(query, { auth: false });

console.log(print(editedAST));
```

## Expected output

```gql
query GetUser($userID: ID!) {
  user(id: $userID) {
    other
  }
}
```

# License

This project is licensed under the MIT License - see the LICENSE file for details