import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { postConfirmation } from '../auth/post-confirmation/resource';
import { userEvents } from '../functions/user-events/resource'
import { fanoutWorker } from "../functions/fanout-worker/resource";
import { sunsetAnalyzer } from "../functions/sunset-analyzer/resource";


const schema = a.schema({
  Post: a
  .model({
    id: a.id().required(),
    owner: a.string().required(),
    content: a.string(),
    imagePath: a.string(),
    likes: a.string().required().array().required()
  })
  .authorization((allow) => [allow.authenticated()]),
  

  UserProfile: a
  .model({
    id: a.id().required(),
    name: a.string().required(),
    imagePath: a.string().required(),
    owner: a.string(),
    followers: a.string().required().array().required(),
    follows: a.string().required().array().required()
  })
  .authorization((allow) => [allow.authenticated()]),

  FeedPost: a.
  model({
    postID: a.string().required(),
    owner: a.string().required(),
    wasViewed: a.boolean().default(false)
  })
  .authorization((allow) => [allow.owner()]),

  UserPost: a.
  model({
    postID: a.string().required()
  })
  .authorization((allow) => [allow.owner()]),

  userEvent: a.mutation()
  .arguments({ userEvent: a.string().required(), originUserID: a.string(), targetUserID: a.string(), newPostID: a.string() })
  .handler(a.handler.function(userEvents))
  .returns(a.boolean()),

  sunsetAnalyzer: a.query()
  .arguments({ imagePath: a.string().required() })
  .returns(a.boolean())
  .handler(a.handler.function(sunsetAnalyzer))
  .authorization(allow => [allow.authenticated()]),
})

.authorization(allow => [
  allow.authenticated(),
  allow.resource(postConfirmation),
  allow.resource(userEvents),
  allow.resource(fanoutWorker),
]);





export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {  
      expiresInDays: 30,
    },
  },
});

