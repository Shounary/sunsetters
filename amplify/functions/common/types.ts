export enum UserEvent {
    FOLLOW_USER = "FOLLOW_USER",
    ADD_POST_TO_FEED = "ADD_POST_TO_FEED"
}


export type UserEventPayload = 
    | { userEvent: UserEvent.FOLLOW_USER; originUserID: string; targetUserID: string }
    | { userEvent: UserEvent.ADD_POST_TO_FEED; originUserID: string; newPostID: string };


export type  SchemaMutationArgs = {

    userEvent: string

    // Base
    originUserID?: string
    targetUserID?: string

    // Post
    newPostID?: string,

}
