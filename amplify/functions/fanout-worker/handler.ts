import type { SNSHandler } from 'aws-lambda';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/fanout-worker';
import { Amplify } from 'aws-amplify';
import type { Schema } from '../../data/resource';
import { UserEvent, UserEventPayload } from '../common/types';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

export const handler: SNSHandler = async (event) => {
  // SNS can send multiple records at once (though usually just 1)
  for (const record of event.Records) {
    try {
      // 1. Parse the message your Dispatcher sent
      const payload = JSON.parse(record.Sns.Message) as UserEventPayload
      console.log(`Worker received event: ${payload.userEvent}`);

      // 2. Route based on the event type
      switch (payload.userEvent) {
        case UserEvent.FOLLOW_USER:
          await followUser(payload);
          break;
          
        case UserEvent.ADD_POST_TO_FEED:
          await addPostToFeed(payload);
          break;

      }
    } catch (err) {
      console.error("Worker failed processing record: ", err);
      // Send this to a Dead Letter Queue (DLQ)
    }
  }
};


async function followUser(payload: UserEventPayload) {

  if (payload.userEvent != UserEvent.FOLLOW_USER) {
    console.error("Mismatch between an event name vs event handler")
    return
  }

  const { data: targetUser } = await client.models.UserProfile.get({ id: payload.targetUserID })

  if (targetUser == null) {
      throw Error(`Failed to get target user ${payload.targetUserID} to follow`)
  }

  const updatedFollowers = targetUser.followers
  updatedFollowers.push(payload.originUserID)

  console.log(`Adding a new follower to ${payload.targetUserID}`);

  client.models.UserProfile.update({
      id: targetUser.id,
      owner: targetUser.owner,
      imagePath: targetUser.imagePath,
      name: targetUser.name,
      followers: updatedFollowers,
      follows: targetUser.follows
  })
}



async function addPostToFeed(payload: UserEventPayload) {

  if (payload.userEvent != UserEvent.ADD_POST_TO_FEED) {
    console.error("Mismatch between an event name vs event handler")
    return
  }
    
  const { data: originUserProfile } = await client.models.UserProfile.get({ id: payload.originUserID })

  console.log(`Fanout: Updating ${(originUserProfile?.followers ?? []).length} follower feeds...`);
  
  await Promise.all(
      (originUserProfile?.followers ?? []).map( follower => client.models.UserFeed.create({
          postID: payload.newPostID,
          ownerID: payload.originUserID
      }))
    )
}