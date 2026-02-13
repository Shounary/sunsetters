import type { AppSyncResolverHandler } from 'aws-lambda';
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/user-events';
import { Amplify } from 'aws-amplify';
import type { Schema } from "../../data/resource";
import { SchemaMutationArgs, UserEvent, UserEventPayload } from '../common/types';


const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

const sns = new SNSClient({});
const client = generateClient<Schema>();

export const handler: AppSyncResolverHandler<SchemaMutationArgs, boolean> = async (event) => {
  const { originUserID, targetUserID, newPostID } = event.arguments
  const userEvent = event.arguments.userEvent as UserEvent

  console.log(`Received operation: ${userEvent} from user: ${originUserID ?? "undefined"}`);

  try {
    switch (userEvent) {
      case UserEvent.FOLLOW_USER:
        if (!originUserID || !targetUserID) throw new Error("Missing originUserID, targetUserID");
        return await followHandler(originUserID, targetUserID);

      case UserEvent.ADD_POST_TO_FEED:
        if (!newPostID || !originUserID) throw new Error("Missing newPostID, originUserID");
        return await updateFeedHandler(originUserID, newPostID);

      default:
        throw new Error(`Unknown operation: ${userEvent}`);
    }
  } catch (error) {
    console.error("Handler failed: ", error);
    throw error; // Propagate error
  }
};

// Individual Handlers

async function followHandler(originUserID: string, targetUserID: string) {
  await publishToSNS({ userEvent: UserEvent.FOLLOW_USER, originUserID: originUserID, targetUserID: targetUserID });
  return true;
}

async function updateFeedHandler(originUserID: string, newPostID: string) {
  await publishToSNS({ userEvent: UserEvent.ADD_POST_TO_FEED, originUserID: originUserID, newPostID: newPostID });
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
  console.log(`Published ${payload.userEvent} to SNS`);
}