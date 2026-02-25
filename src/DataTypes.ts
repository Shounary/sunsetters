

export type PostDisplay = {
    // user
    id: string,
    ownerID: string,
    ownerName: string,
    ownerImagePath: string,
    content: string,
    mediaURLs: URL[]
}

export type UserDisplay = {
    id: string
    name: string
    profilePicture: URL
}

export interface INewPost {
    textInput: string
    imageInput: File | null
}