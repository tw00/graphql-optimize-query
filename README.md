# graphql-optimize-query

A lightweight library to optimize graphql queries by evaluating `@include` and `@skip` directives client-side.

# Usage

```bash
npm install graphql-optimize-query
```

```js
import { optimizeQuery } from 'graphql-optimize-query'

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