## Sunsetters

Social media that focuses on capturing the sunsets on planet Earth (no sunrises!).
Deployed master branch: https://main.d3byukh2m7etfz.amplifyapp.com

## Overview


On a technical level this is a news feed system where users can follow each other and create posts upload images featuring sunsets. Most of the functionality implemented are based on AWS.

## Features
- **Stack**: Node.js + React TS + Vite

- **Authentication**: Amazon Cognito for secure user authentication.
- **API**: GraphQL endpoint with AWS AppSync.
- **Database**: Real-time database powered by Amazon DynamoDB.
- **Storage**: Amazon S3 utilized for media storage.
- **Fanout**: Utilizes Amazon SNS and SQS (+Lambda functions) for fanout messaging.