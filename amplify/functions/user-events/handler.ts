import type { AppSyncResolverHandler } from 'aws-lambda';
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/user-events';
import { Amplify } from 'aws-amplify';
import type { Schema } from "../../data/resource";


const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

const sns = new SNSClient({});
const client = generateClient<Schema>();


type MutationArgs = {
    // Follow
    userID?: string,

    // Post
    postID?: string,
    ownerID?: string,

    targetUserId?: string
}

export const handler: AppSyncResolverHandler<MutationArgs, boolean> = async (event) => {
  const { fieldName } = event.info;
  const { sub } = event.identity as any;

  console.log(`Received operation: ${fieldName} from user: ${sub}`);

  try {
    switch (fieldName) {
      case "FOLLOW":
        if (!event.arguments.userID) throw new Error("Missing userID");
        return await followHandler(sub, event.arguments.targetUserId ?? "DUD");

      case "POST":
        if (!event.arguments.postID || !event.arguments.ownerID) throw new Error("Missing postID, ownerID");
        //return await handleUpdateStatus(sub, event.arguments.status);

      default:
        throw new Error(`Unknown operation: ${fieldName}`);
    }
  } catch (error) {
    console.error("Handler failed:", error);
    throw error; // Propagate error to frontend
  }
};

// Individual Handlers

async function followHandler(foollowerId: string, targetUserId: string) {

    
  await publishToSNS("FOLLOW", { foollowerId, targetUserId });
  return true;
}

async function handleUpdateStatus(userId: string, newStatus: string) {

  await publishToSNS("POST", { userId, status: newStatus });
  return true;
}

async function publishToSNS(eventType: string, payload: any) {
  await sns.send(new PublishCommand({
    TopicArn: process.env.SNS_TOPIC_ARN, // Injected from backend.ts
    Message: JSON.stringify({
      event: eventType,
      timestamp: new Date().toISOString(),
      ...payload
    })
  }));
  console.log(`Published ${eventType} to SNS`);
}