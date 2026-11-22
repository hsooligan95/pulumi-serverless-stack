---
mode: agent
description: Review the current diff against pulumi-serverless-stack's invariants
---

Review my current diff against this repo's invariants:

- Least privilege is the point: the function's role can only read/write its own table — never widen IAM policies or attach managed admin policies.
- The handler has no bundled dependencies by design; don't add a bundler or node_modules packaging to the Lambda archive.
- Stack outputs (apiUrl, tableName, functionName) and the route set are the contract; the table name reaches the handler via TABLE_NAME.
- Never claim a deploy happened without evidence of one; deployment is intentionally not automated here.

Flag every violation with file and line. Also flag any change that
alters a documented behavior contract (output shapes, exit codes,
event schemas, recorded artifacts) without updating the docs and
tests that describe it. No style nitpicks — correctness and contract
violations only.
