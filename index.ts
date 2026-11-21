import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

/**
 * pulumi-serverless-stack
 *
 * A small serverless API defined entirely in TypeScript with Pulumi:
 *
 *   HTTP API (API Gateway v2) -> Lambda (Node.js 20) -> DynamoDB (on-demand)
 *
 * Routes:
 *   GET    /items        list items
 *   GET    /items/{id}   get one item
 *   POST   /items        create an item
 *   DELETE /items/{id}   delete an item
 *
 * The Lambda IAM role is scoped to this table only (least privilege).
 */

// --- Data: DynamoDB table -------------------------------------------------

const table = new aws.dynamodb.Table("items", {
  billingMode: "PAY_PER_REQUEST",
  hashKey: "id",
  attributes: [{ name: "id", type: "S" }],
  tags: { Project: "pulumi-serverless-stack" },
});

// --- Compute: Lambda execution role (least privilege) ---------------------

const lambdaRole = new aws.iam.Role("api-lambda-role", {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: "lambda.amazonaws.com",
  }),
});

new aws.iam.RolePolicyAttachment("api-lambda-basic-execution", {
  role: lambdaRole.name,
  policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
});

// The function may only touch this one table.
new aws.iam.RolePolicy("api-lambda-dynamodb", {
  role: lambdaRole.id,
  policy: table.arn.apply((arn) =>
    JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "dynamodb:GetItem",
            "dynamodb:PutItem",
            "dynamodb:DeleteItem",
            "dynamodb:Scan",
          ],
          Resource: arn,
        },
      ],
    }),
  ),
});

// --- Compute: Lambda function ----------------------------------------------

const handler = new aws.lambda.Function("api-handler", {
  runtime: "nodejs20.x",
  handler: "index.handler",
  role: lambdaRole.arn,
  code: new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("./handler"),
  }),
  environment: {
    variables: { TABLE_NAME: table.name },
  },
  timeout: 30,
  memorySize: 256,
  tags: { Project: "pulumi-serverless-stack" },
});

// --- Edge: HTTP API ----------------------------------------------------------

const api = new aws.apigatewayv2.Api("items-api", {
  protocolType: "HTTP",
  tags: { Project: "pulumi-serverless-stack" },
});

const integration = new aws.apigatewayv2.Integration("api-integration", {
  apiId: api.id,
  integrationType: "AWS_PROXY",
  integrationUri: handler.invokeArn,
  payloadFormatVersion: "2.0",
});

const routes = ["GET /items", "GET /items/{id}", "POST /items", "DELETE /items/{id}"];
for (const routeKey of routes) {
  new aws.apigatewayv2.Route(`route-${routeKey.replace(/[^a-zA-Z0-9]/g, "-")}`, {
    apiId: api.id,
    routeKey,
    target: pulumi.interpolate`integrations/${integration.id}`,
  });
}

new aws.apigatewayv2.Stage("api-stage", {
  apiId: api.id,
  name: "$default",
  autoDeploy: true,
});

new aws.lambda.Permission("api-permission", {
  action: "lambda:InvokeFunction",
  function: handler.name,
  principal: "apigateway.amazonaws.com",
  sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
});

// --- Outputs -----------------------------------------------------------------

export const apiUrl = api.apiEndpoint;
export const tableName = table.name;
export const functionName = handler.name;
