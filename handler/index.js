"use strict";

/**
 * Items API handler.
 *
 * Backed by DynamoDB (table name from the TABLE_NAME env var, set by the
 * Pulumi program). Uses the AWS SDK for JavaScript v3, which is bundled in
 * the Node.js 20 Lambda runtime - no dependencies to package.
 *
 * Routes (API Gateway HTTP API, payload format 2.0):
 *   GET    /items        -> list all items
 *   GET    /items/{id}   -> one item or 404
 *   POST   /items        -> create from JSON body { "name": "...", ... }
 *   DELETE /items/{id}   -> delete one item
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { randomUUID } = require("node:crypto");

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME;

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: body === undefined ? "" : JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  const method = event.requestContext.http.method;
  const id = event.pathParameters && event.pathParameters.id;

  try {
    if (method === "GET" && !id) {
      const out = await doc.send(new ScanCommand({ TableName: TABLE_NAME }));
      return respond(200, { items: out.Items ?? [] });
    }

    if (method === "GET" && id) {
      const out = await doc.send(
        new GetCommand({ TableName: TABLE_NAME, Key: { id } }),
      );
      if (!out.Item) return respond(404, { error: "item not found" });
      return respond(200, out.Item);
    }

    if (method === "POST") {
      const data = JSON.parse(event.body || "{}");
      if (!data.name) return respond(400, { error: "'name' is required" });
      const item = { id: randomUUID(), ...data };
      await doc.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
      return respond(201, item);
    }

    if (method === "DELETE" && id) {
      await doc.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { id } }));
      return respond(204);
    }

    return respond(404, { error: "route not found" });
  } catch (err) {
    console.error(err);
    return respond(500, { error: "internal error" });
  }
};
