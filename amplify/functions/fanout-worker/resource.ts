import { defineFunction } from '@aws-amplify/backend';

export const fanoutWorker = defineFunction({
  name: 'fanout-worker',
  timeoutSeconds: 60, // Give it time to process loop
});