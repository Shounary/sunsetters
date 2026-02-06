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
  const { sub } = event.request.userAttributes;

  await client.models.UserProfile.create({
    id: sub, // Use Cognito 'sub' as the DB primary key
    name: "name", 
    imagePath: "default-profile-pictures/default-pfp1.png"
  }).then((response) => {
    console.log('AppSync Response:', JSON.stringify(response, null, 2));

    if (response.errors) {
      console.error('GraphQL Errors:', response.errors);
    } else {
      console.log('Successfully created:', response.data);
    }
  });

  return event;
};