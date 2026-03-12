import { defineFunction } from '@aws-amplify/backend';

export const rateLimiter = defineFunction({
  name: 'rate-limiter',
  entry: './handler.ts',
  resourceGroupName: 'data',
});