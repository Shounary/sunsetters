import { defineFunction } from '@aws-amplify/backend';

export const userEvents = defineFunction({
  name: 'user-events',
  environment: {
    SNS_TOPIC_ARN: '' 
  }
});