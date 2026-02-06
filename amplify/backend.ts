import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { postConfirmation } from './auth/post-confirmation/resource';

defineBackend({
  auth,
  data,
  storage,
  postConfirmation
});
