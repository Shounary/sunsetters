import { defineBackend } from '@aws-amplify/backend';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cdk from 'aws-cdk-lib/core';
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
import { rateLimiter } from './functions/rate-limiter/resource';
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
  sunsetAnalyzer,
  rateLimiter
});


// Fanout SNS setup
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


// sunsetAnalyzer permissions
backend.sunsetAnalyzer.addEnvironment(
  'BUCKET_NAME',
  backend.storage.resources.bucket.bucketName
);

backend.storage.resources.bucket.grantRead(backend.sunsetAnalyzer.resources.lambda);

backend.sunsetAnalyzer.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['rekognition:DetectLabels'],
    resources: ['*'],
  })
);


// rateLimiter setup
const rateLimitTable = new dynamodb.Table(
  backend.createStack('RateLimitStack'), 
  'DailyRateLimits', 
  {
    partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    removalPolicy: cdk.RemovalPolicy.DESTROY, 
    timeToLiveAttribute: 'expireAt' 
  }
);

rateLimitTable.grantReadWriteData(backend.rateLimiter.resources.lambda);

backend.rateLimiter.addEnvironment(
  'RATE_LIMIT_TABLE',
  rateLimitTable.tableName
);


// Backend monitoring
const monitoringStack = backend.createStack('DatadogMonitoringStack');

const datadogSecret = Secret.fromSecretNameV2(
  monitoringStack, 
  'DDSecretLookup', 
  'DatadogApiKey'
);

const datadog = new DatadogLambda(monitoringStack, 'DatadogIntegration', {
  nodeLayerVersion: 114, 
  extensionLayerVersion: 61,
  site: 'us3.datadoghq.com',
  apiKeySecretArn: datadogSecret.secretArn, 
  env: 'prod',
  service: 'sunsetters-backend',
})

datadog.addLambdaFunctions([
  backend.postConfirmation.resources.lambda as lambda.Function,
  backend.userEvents.resources.lambda as lambda.Function,
  backend.fanoutWorker.resources.lambda as lambda.Function,
  backend.sunsetAnalyzer.resources.lambda as lambda.Function,
  backend.rateLimiter.resources.lambda as lambda.Function
]);