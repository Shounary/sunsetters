import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { postConfirmation } from './auth/post-confirmation/resource';

import { userEvents } from './functions/user-events/resource';
import { fanoutWorker } from './functions/fanout-worker/resource';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';


const backend = defineBackend({
  auth,
  data,
  storage,
  userEvents,
  fanoutWorker,
  postConfirmation
});

const fanoutStack = backend.createStack('UserFanoutStack')

const userEventsTopic = new sns.Topic(fanoutStack, 'UserEventsTopic', {
  topicName: 'user-events-topic'
})

backend.userEvents.addEnvironment(
  'SNS_TOPIC_ARN',
  userEventsTopic.topicArn
)

userEventsTopic.grantPublish(backend.userEvents.resources.lambda)

userEventsTopic.addSubscription(
  new subs.LambdaSubscription(backend.fanoutWorker.resources.lambda)
)