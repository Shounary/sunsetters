import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { postConfirmation } from './auth/post-confirmation/resource';
import { DatadogLambda } from 'datadog-cdk-constructs-v2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

import { userEvents } from './functions/user-events/resource';
import { fanoutWorker } from './functions/fanout-worker/resource';
import { sunsetAnalyzer } from './functions/sunset-analyzer/resource';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';

const backend = defineBackend({
  auth,
  data,
  storage,
  userEvents,
  fanoutWorker,
  postConfirmation,
  sunsetAnalyzer
});

const fanoutStack = backend.createStack('UserFanoutStack');

const userEventsTopic = new sns.Topic(fanoutStack, 'UserEventsTopic');

backend.userEvents.addEnvironment(
  'SNS_TOPIC_ARN',
  userEventsTopic.topicArn
);

userEventsTopic.grantPublish(backend.userEvents.resources.lambda);

userEventsTopic.addSubscription(
  new subs.LambdaSubscription(backend.fanoutWorker.resources.lambda)
);

// 1. Give the function the name of your S3 bucket
backend.sunsetAnalyzer.addEnvironment(
  'BUCKET_NAME',
  backend.storage.resources.bucket.bucketName
);

// 2. Grant the function permission to read files from that bucket
backend.storage.resources.bucket.grantRead(backend.sunsetAnalyzer.resources.lambda);

// 3. Grant the function permission to call AWS Rekognition
backend.sunsetAnalyzer.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['rekognition:DetectLabels'],
    resources: ['*'],
  })
);


// Backend monitoring
// const monitoringStack = backend.createStack('DatadogMonitoringStack');

// const datadogSecret = Secret.fromSecretNameV2(
//   monitoringStack, 
//   'DDSecretLookup', 
//   'DatadogApiKey'
// );

// const datadog = new DatadogLambda(monitoringStack, 'DatadogIntegration', {
//   nodeLayerVersion: 114, 
//   extensionLayerVersion: 61,
//   site: 'us3.datadoghq.com',
//   apiKeySecretArn: datadogSecret.secretArn, 
//   env: 'prod',
//   service: 'sunsetters-backend',
// })

// datadog.addLambdaFunctions([
//   backend.postConfirmation.resources.lambda as lambda.Function,
//   backend.userEvents.resources.lambda as lambda.Function,
//   backend.fanoutWorker.resources.lambda as lambda.Function
// ]);