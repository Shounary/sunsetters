import type { AppSyncResolverHandler } from 'aws-lambda';
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/user-events';
import { Amplify } from 'aws-amplify';
import type { Schema } from "../../data/resource";
import { SchemaMutationArgs, UserEventPayload } from '../common/types';


const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

const sns = new SNSClient({});
const client = generateClient<Schema>();

export const handler: AppSyncResolverHandler<SchemaMutationArgs, boolean> = async (event) => {
  const { fieldName } = event.info;
  const { originUserID, targetUserID, newPostID } = event.arguments

  console.log(`Received operation: ${fieldName} from user: ${originUserID ?? "undefined"}`);

  try {
    switch (fieldName) {
      case "followUser":
        if (!originUserID || !targetUserID) throw new Error("Missing originUserID, targetUserID");
        return await followHandler(originUserID, targetUserID);

      case "addPostToFollowerFeeds":
        if (!newPostID || !originUserID || !targetUserID) throw new Error("Missing newPostID, originUserID, targetUserID");
        return await updateFeedHandler(originUserID, targetUserID, newPostID);

      default:
        throw new Error(`Unknown operation: ${fieldName}`);
    }
  } catch (error) {
    console.error("Handler failed: ", error);
    throw error; // Propagate error
  }
};

// Individual Handlers

async function followHandler(originUserID: string, targetUserID: string) {
  await publishToSNS({ event: "FOLLOW_USER", originUserID: originUserID, targetUserID: targetUserID });
  return true;
}

async function updateFeedHandler(originUserID: string, targetUserID: string, newPostID: string) {
  await publishToSNS({ event: "ADD_POST_TO_FEED", originUserID: originUserID, newPostID: newPostID });
  return true;
}

async function publishToSNS(payload: UserEventPayload) {
  await sns.send(new PublishCommand({
    TopicArn: process.env.SNS_TOPIC_ARN,
    Message: JSON.stringify({
      ...payload,
      timestamp: new Date().toISOString(),
    })
  }));
  console.log(`Published ${payload.event} to SNS`);
}