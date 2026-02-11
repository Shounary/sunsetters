import type { SNSHandler } from 'aws-lambda';
import { generateClient } from 'aws-amplify/data';
// import { env } from '$amplify/env/fanout-worker';
import type { Schema } from '../../data/resource';

const client = generateClient<Schema>();

export const handler: SNSHandler = async (event) => {
  // SNS can send multiple records at once (though usually just 1)
  for (const record of event.Records) {
    try {
      // 1. Parse the message your Dispatcher sent
      const payload = JSON.parse(record.Sns.Message);
      console.log(`Worker received event: ${payload.event}`);

      // 2. Route based on the event type
      switch (payload.event) {
        case "FOLLOW":
          await followUser(payload);
          break;
        case "POST":
          await updateFollowerFeeds(payload);
          break;
      }
    } catch (err) {
      console.error("Worker failed processing record:", err);
      // Send this to a Dead Letter Queue (DLQ)
    }
  }
};


async function followUser(payload: any) {
    const { userId } = payload;
    // parse payload

    const { data: targetUser } = await client.models.UserProfile.get({ id: payload.targetUserId })

    if (targetUser == null) {
        throw Error("Failed to get target user to follow")
    }

    const followers = targetUser.followers
    followers.push("payload originUserID")

    client.models.UserProfile.update({
        id: targetUser.id,
        owner: targetUser.owner,
        imagePath: targetUser.imagePath,
        name: targetUser.name,
        followers: followers,
        follows: targetUser.follows
    })
}



async function updateFollowerFeeds(payload: any) {
    const { userId } = payload;
    // parse payload
    
    const { data: targetUserProfile } = await client.models.UserProfile.get({ id: payload.targetUserId })

    console.log(`Fanout: Updating ${(targetUserProfile?.followers ?? []).length} followers...`);
    
    await Promise.all(
            (targetUserProfile?.followers ?? []).map( follower => client.models.UserFeed.create({
                postID: "payload postID variable",
                ownerID: "payload ownerID variable"
            }))
        )
}