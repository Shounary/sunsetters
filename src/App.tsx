import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { getUrl, uploadData, remove } from "aws-amplify/storage";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { PostDisplay } from "./DisplayTypes";

const client = generateClient<Schema>();

async function fetchPostFeed() {
    const { data: feedPosts } = await client.models.Post.list()
    return feedPosts
}

function App() {
    const [file, setFile] = useState<File | null>(null);
    const [, setPosts] = useState<Array<Schema["Post"]["type"]>>([])
    const [feedDislay, setFeedDisplay] = useState<Array<PostDisplay>>([])
    const { user, signOut } = useAuthenticator()


    // FILE UPLOAD
    const handleFileChange = (f: any) => {
        // files is an array-like object; we want the first one
        setFile(f.target.files[0]);
    };

    const handleUpload = () => {
        if (!file) return;
        console.log("Uploading:", file.name);
        // Logic to send file to server goes here

        // CREATE A POST
        // Create a dud post
        client.models.Post.create({
            // timestamp: new Date().getUTCDate().toString()
            content: "Created a static test post with custom image"
        }).then((post) => {
            if (!post.data) {
                console.warn("Post contains empty data!");
                return
            }
            console.log(`File ${file.name} selected`)
            const postData = post.data

            // Upload image to S3 storage
            uploadData({
                path: `images/${post.data.id}-${file.name}`,
                data: file,
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
                    console.log(`Post for ${file.name} update with newly uploaded image ${uploaded.path}`)
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
            remove({ path: post.data?.imagePath })
            client.models.Post.delete({ id: id })
        })
    }


    // FEED DISPLAY
    const fetchExtratedFeed = async () => {
        const postFeed = await fetchPostFeed()
        postFeed.forEach(async post => {
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
        client.models.Post.observeQuery().subscribe({
            next: (post) => setPosts([...post.items]),
        })

        client.models.Post.observeQuery().subscribe({
            next: () => fetchExtratedFeed(),
        })
    }, [])

    return (
        <main>
            <h1>Welcome {user?.signInDetails?.loginId}</h1>
            <button onClick={ signOut }>SIGN OUT</button>

            <div className="upload-container">
                <input type="file" onChange={handleFileChange} />
                <button onClick={handleUpload}>Upload</button>
                {file && <p>Selected: {file.name}</p>}
            </div>

            <ul>
                {feedDislay.map((displayPost) => (<li
                    onClick={() => deletePost(displayPost.id)}
                    key={displayPost.id}>
                    <div className="image-container">
                        <img 
                            src={displayPost.mediaURLs[0].toString()} 
                            alt={displayPost.mediaURLs[0].toString()} 
                            style={{ width: '100%', height: '250px', borderRadius: '8px' }} 
                        />
                    </div>
                </li>
                ))}
            </ul>
        </main>
    );
}

export default App;
