import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../../data/resource';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/post-confirmation';
import { Amplify } from 'aws-amplify';


const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

export const handler: PostConfirmationTriggerHandler = async (event) => {
  const { sub, name } = event.request.userAttributes;

  try {
    await client.models.UserProfile.create({
      id: sub, // Use Cognito 'sub' as the DB primary key
      name: name, 
      imagePath: "default-profile-pictures/default-pfp1.png"
    });   
    console.log('Successfully created user profile and added it to USER model in GraphQL');
  } catch (error) {
    console.error('Error creating user profile in GraphQL:', JSON.stringify(error, null, 2));
  }

  return event;
};