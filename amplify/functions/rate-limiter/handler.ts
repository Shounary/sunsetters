import { DynamoDBClient, UpdateItemCommand, ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import type { Schema } from "../../data/resource";

const dynamodb = new DynamoDBClient();
const MAX_POSTS_PER_DAY = "5"; 

export const handler: Schema["checkRateLimit"]["functionHandler"] = async (event) => {
  const identity = event.identity as { sub?: string } | undefined;
  const userId = identity?.sub;
  if (!userId) throw new Error("Unauthorized");

  const tableName = process.env.RATE_LIMIT_TABLE;
  if (!tableName) throw new Error("RATE_LIMIT_TABLE missing");

  // Create a partition key based on the user ID and the current date (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];
  const partitionKey = `${userId}#${today}`;

  try {
    const command = new UpdateItemCommand({
      TableName: tableName,
      Key: {
        "PK": { S: partitionKey }
      },
      // Atomically add 1 to the 'requests' attribute
      UpdateExpression: "ADD requests :one",
      // Only succeed if it doesn't exist yet, OR if it's currently under the limit
      ConditionExpression: "attribute_not_exists(requests) OR requests < :maxLimit",
      ExpressionAttributeValues: {
        ":one": { N: "1" },
        ":maxLimit": { N: MAX_POSTS_PER_DAY }
      },
      ReturnValues: "UPDATED_NEW"
    });

    await dynamodb.send(command);
    
    return true;

  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      console.warn(`User ${userId} hit their daily rate limit.`);
      return false;
    }
    console.error("DynamoDB error:", error);
    throw new Error("Failed to check rate limit");
  }
};