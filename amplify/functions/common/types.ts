

export type UserEventPayload = 
  | { event: "FOLLOW_USER"; originUserID: string; targetUserID: string }
  | { event: "ADD_POST_TO_FEED"; originUserID: string; newPostID: string };

export type  SchemaMutationArgs = {

  // Base
  originUserID?: string
  targetUserID?: string

  // Post
  newPostID?: string,

}