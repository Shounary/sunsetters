

export type PostDisplay = {
    // user
    id: string,
    content: string,
    mediaURLs: URL[]
}

export interface INewPost {
    textInput: string
    imageInput: File | null
}