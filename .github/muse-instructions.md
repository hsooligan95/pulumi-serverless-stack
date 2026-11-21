# Copilot instructions — pulumi-serverless-stack

You are working in **pulumi-serverless-stack**, a small serverless API
defined entirely in TypeScript with Pulumi: an HTTP API fronts a single
Lambda function backed by a DynamoDB table, with a least-privilege IAM
role scoped to that table only.

## Stack

- TypeScript (strict) with `@pulumi/pulumi` and `@pulumi/aws`.
- `index.ts` — the whole Pulumi program: table, IAM role + policies,
  Lambda, HTTP API, routes, stage, invoke permission, stack outputs
  (`apiUrl`, `tableName`, `functionName`).
- `handler/index.js` — the Lambda code (plain JavaScript, packaged via
  `FileArchive`), using the AWS SDK for JavaScript v3 that ships in
  the Node.js 20 Lambda runtime.

## Tests

```bash
npm run typecheck   # tsc --noEmit — there is no test suite; typecheck is the gate
```

## Architecture notes

- Least privilege is the point of this repo: the function's role can
  only read/write its own table. Never widen IAM policies for
  convenience, and never attach managed admin policies.
- Routes: `GET /items`, `GET /items/{id}`, `POST /items` (`name`
  required), `DELETE /items/{id}` — AWS_PROXY integration, payload
  format 2.0, table name passed via the `TABLE_NAME` env var.
- The handler has no bundled dependencies by design — don't add a
  bundler or node_modules packaging to the Lambda archive.
- Deployment requires the Pulumi CLI, a backend login, and real AWS
  credentials, and is intentionally not automated here. Never claim a
  deploy happened without evidence of one.

## Shared rules

- Use Unix LF line endings in every file; never CRLF.
- Never commit secrets, tokens, or credentials — real or synthetic-looking.
- Tests must pass before you describe a change as complete; run the test
  command above and report honestly if you cannot.
- Prefer the smallest complete implementation: reuse what already exists in
  this repo before adding new code, files, or dependencies.
