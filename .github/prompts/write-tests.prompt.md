---
mode: agent
description: Write tests for a named module in pulumi-serverless-stack
---

Write tests for the module I name, following this repo's existing test
style, layout, and fixtures. Cover the behavior the module documents,
including these invariants where they apply:

- Least privilege is the point: the function's role can only read/write its own table — never widen IAM policies or attach managed admin policies.
- The handler has no bundled dependencies by design; don't add a bundler or node_modules packaging to the Lambda archive.
- Stack outputs (apiUrl, tableName, functionName) and the route set are the contract; the table name reaches the handler via TABLE_NAME.

Then run the test suite:

    npm run typecheck   # tsc --noEmit; typecheck is the gate

Show the result. Do not claim done unless the suite is green; if a
test cannot pass, say why instead of weakening the assertion.
