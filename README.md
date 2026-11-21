# pulumi-serverless-stack

A small **serverless API** defined entirely in TypeScript with
[Pulumi](https://www.pulumi.com) — infrastructure as real code, not YAML
templates. An HTTP API fronts a single Lambda function backed by a DynamoDB
table, with a least-privilege IAM role scoped to that table only.

## What this demonstrates

- **Pulumi** and **infrastructure as code** in a general-purpose language (**TypeScript**)
- **Serverless** architecture on **AWS**: API Gateway (HTTP API) + Lambda + DynamoDB
- IAM least-privilege design: the function's role can only read/write its own table
- Infrastructure and application code in one repo, reviewed like software

## Architecture

```
client
  |
  v
API Gateway (HTTP API, $default stage)
  |  AWS_PROXY integration, payload format 2.0
  v
Lambda (Node.js 20, handler/index.js)  -- TABLE_NAME env var
  |
  v
DynamoDB table "items" (on-demand billing, hash key: id)
```

| Route | Behavior |
| --- | --- |
| `GET /items` | List all items |
| `GET /items/{id}` | Get one item (404 if missing) |
| `POST /items` | Create an item from a JSON body (`name` required) |
| `DELETE /items/{id}` | Delete one item |

The handler uses the AWS SDK for JavaScript v3, which ships in the Node.js 20
Lambda runtime — nothing to bundle.

## Layout

- `index.ts` — the Pulumi program: table, IAM role + policies, Lambda, HTTP
  API, routes, stage, invoke permission, and stack outputs (`apiUrl`,
  `tableName`, `functionName`).
- `handler/index.js` — the Lambda function code (packaged via `FileArchive`).
- `Pulumi.yaml` — project definition (Node.js runtime, TypeScript).

## Deploy

> Requires the Pulumi CLI, a Pulumi Cloud (or local) backend login, and AWS
> credentials for the target account. Deployment creates real AWS resources
> and is intentionally not automated here.

```bash
npm install
pulumi stack init dev
pulumi up
```

Try it:

```bash
curl $API_URL/items -X POST -d '{"name":"first item"}' -H 'content-type: application/json'
curl $API_URL/items
```

Tear down:

```bash
pulumi destroy
```

## Verify without deploying

```bash
npm install
npm run typecheck   # tsc --noEmit over the Pulumi program
```

## License

MIT
