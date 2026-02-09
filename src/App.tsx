import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { getUrl, uploadData, remove } from "aws-amplify/storage";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { PostDisplay, INewPost } from "./DataTypes";
import { AvatarImage } from "./DisplayTypes";

function App() {
    const client = generateClient<Schema>();
    async function fetchPostFeed() {
        const { data: feedPosts } = await client.models.Post.list()
        return feedPosts
    }
    

    const [newPost, setNewPost] = useState<INewPost>({
        textInput: '',
        imageInput: null
    })
    const [feedDisplay, setFeedDisplay] = useState<Array<PostDisplay>>([])
    const [userProfile, setUserProfile] = useState<Schema["UserProfile"]["type"]>()
    const { user, signOut } = useAuthenticator()


    // FILE UPLOAD
    const handleNewPostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // files is an array-like object; we want the first one
        const { name, value, files, type } = e.target
        setNewPost((prev) => ({
            ...prev,
            [name]: type === 'file' ? (files ? files[0] : null) : value
        }))
        console.log(newPost.textInput)
    };

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newPost || (!newPost.imageInput && newPost.textInput == '')) return;
        // console.log("Uploading:", new.name);
        // Logic to send file to server goes here

        // CREATE A POST
        // Create a dud post
        client.models.Post.create({
            // timestamp: new Date().getUTCDate().toString()
            content: newPost.textInput
        }).then((post) => {
            if (!post.data) {
                console.warn("Post contains empty data!");
                return
            }
            // console.log(`File ${file.name} selected`)
            const postData = post.data
            if (!newPost.imageInput) {
                console.log("The post included no media!")
                return
            }

            // Upload image to S3 storage
            uploadData({
                path: `images/${post.data.id}-${newPost.imageInput.name}`,
                data: newPost.imageInput,
                options: {
                    contentType: "image/png"
                }
            }).result.then((uploaded) => {
                console.log(`Image ${uploaded.path} uploaded to storage`)

                // Update the dud post with S3 path
                client.models.Post.update({
                    id: postData.id,
                    content: postData.content,
                    imagePath: uploaded.path
                }).then(() => {
                    console.log(`Post for ${newPost.imageInput?.name} update with newly uploaded image ${uploaded.path}`)
                })
            })
        })
    }


    // DELETE POST
    const deletePost = (id: string) => {
        client.models.Post.get({ id: id }).then((post) => {
            if (!post || !post.data?.imagePath) {
               console.warn(`Could not find post with id ${id} to delete!`)
               return
            }
            client.models.Post.delete({ id: id })
            setFeedDisplay((prev) => prev.filter((f) => f.id !== id))
            remove({ path: post.data?.imagePath })
        })
    }


    // FEED DISPLAY
    const fetchExtratedFeed = async () => {
        const postFeed = await fetchPostFeed()
        postFeed.forEach(async post => {
            setFeedDisplay(() => [])
            if (!post.imagePath) return
            const imageURL = await getUrl({ path: post.imagePath })
            const postDisplay: PostDisplay = {
                id: post.id,
                content: post.content ?? "",
                mediaURLs: [imageURL.url]
            }
            setFeedDisplay((prev) => [...prev, postDisplay])
        });
    }

    useEffect(() => {
        const postSub = client.models.Post.observeQuery().subscribe({
            next: () => fetchExtratedFeed(),
        })

        
        const userSub = client.models.UserProfile.observeQuery({
            filter: { 
                id: { eq: user.userId } 
            }
        }).subscribe({
            next: ({ items }) => {
                console.log(`Fetching user by id: ${user.userId}`)
                setUserProfile(items[0]);
            }
        })

        return () => {
            postSub.unsubscribe()
            userSub.unsubscribe()
        }
    }, [])

    return (
        <main>
            <h1>Welcome {user?.signInDetails?.loginId}</h1>
            <div>
                {userProfile?.imagePath && (
                <AvatarImage imagePath={userProfile.imagePath} />
                )}
            </div>
            <h2>Image: {userProfile?.imagePath}</h2>
            <button onClick={ signOut }>SIGN OUT</button>

            <form onSubmit={handleUpload}>
                <div>
                    <label>Text:</label>
                    <input 
                        type="text" 
                        name="textInput"
                        value={newPost.textInput} 
                        onChange={handleNewPostChange} 
                    />
                </div>

                <div>
                    <label>Media:</label>
                    <input 
                        type="file" 
                        name="imageInput" 
                        onChange={handleNewPostChange} 
                    />
                </div>

                <button type="submit">Post</button>
            </form>

            <ul>
                {feedDisplay.map((displayPost) => (<li
                    onClick={() => deletePost(displayPost.id)}
                    key={displayPost.id}>
                    <div className="image-container">
                        <img 
                            src={displayPost.mediaURLs[0].toString()} 
                            alt={displayPost.mediaURLs[0].toString()} 
                            style={{ width: '100%', height: '250px', borderRadius: '8px' }} 
                        />
                        <h3>{displayPost.content}</h3>
                    </div>
                </li>
                ))}
            </ul>
        </main>
    );
}

export default App;
