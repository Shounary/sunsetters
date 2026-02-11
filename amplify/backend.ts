import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { postConfirmation } from './auth/post-confirmation/resource';

import { userEvents } from './functions/user-events/resource';
import * as sns from 'aws-cdk-lib/aws-sns';


const backend = defineBackend({
  auth,
  data,
  storage,
  userEvents,
  postConfirmation
});

const fanoutStack = backend.createStack('UserFanoutStack')

const userUpdatesTopic = new sns.Topic(fanoutStack, 'UserUpdatesTopic', {
  topicName: 'user-updates-topic'
})

backend.userEvents.addEnvironment(
  'SNS_TOPIC_ARN',
  userUpdatesTopic.topicArn
)

userUpdatesTopic.grantPublish(backend.userEvents.resources.lambda)
