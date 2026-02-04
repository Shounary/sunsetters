import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../../data/resource';

const client = generateClient<Schema>();

export const handler: PostConfirmationTriggerHandler = async (event) => {
  const { sub, name } = event.request.userAttributes;

  await client.models.UserProfile.create({
    id: sub, // Use Cognito 'sub' as the DB primary key
    name: name, 
    imagePath: "default-profile-pictures/default-pfp1.png"
  });   

  return event;
};