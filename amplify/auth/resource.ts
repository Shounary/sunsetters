import { defineAuth } from '@aws-amplify/backend';
// import { postConfirmation } from './post-confirmation/resource';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  userAttributes: {
    fullname: {
      mutable: true,
      required: true
    }
  },
  loginWith: {
    email: true,
  },
  // triggers: {
  //   postConfirmation
  // }
});
