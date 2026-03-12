import { DynamoDBClient, UpdateItemCommand, ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import type { Schema } from "../../data/resource";

const dynamodb = new DynamoDBClient();
const MAX_POSTS_PER_HOUR = "5"

export const handler: Schema["checkRateLimit"]["functionHandler"] = async (event) => {
  const identity = event.identity as { sub?: string } | undefined;
  const userId = identity?.sub;
  if (!userId) throw new Error("Unauthorized");

  const tableName = process.env.RATE_LIMIT_TABLE;
  if (!tableName) throw new Error("RATE_LIMIT_TABLE missing");

  // Create a partition key based on the user ID and the current date (YYYY-MM-DD)
  const now = new Date().toISOString()
  const currentHour = now.substring(0, 13)
  const partitionKey = `${userId}#${currentHour}`

  // Calculate TTL: now + 2 hours
  const expireAtSeconds = Math.floor(Date.now() / 1000) + (2 * 60 * 60);

  try {
    const command = new UpdateItemCommand({
      TableName: tableName,
      Key: {
        "PK": { S: partitionKey }
      },
      // Atomically add 1 to the 'requests' attribute
      UpdateExpression: "ADD requests :one SET expireAt = :ttl",
      // Only succeed if it doesn't exist yet, OR if it's currently under the limit
      ConditionExpression: "attribute_not_exists(requests) OR requests < :maxLimit",
      ExpressionAttributeValues: {
        ":one": { N: "1" },
        ":maxLimit": { N: MAX_POSTS_PER_HOUR },
        ":ttl": { N: expireAtSeconds.toString() }
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