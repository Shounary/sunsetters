import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { uploadData } from "aws-amplify/storage";
import { useAuthenticator } from "@aws-amplify/ui-react";

const client = generateClient<Schema>();

function App() {
    const [file, setFile] = useState<File | null>(null);
    const [posts, setPosts] = useState<Array<Schema["Post"]["type"]>>([])
    const { user, signOut } = useAuthenticator()


    const handleFileChange = (f: any) => {
        // files is an array-like object; we usually want the first one
        setFile(f.target.files[0]);
    };

    const handleUpload = () => {
        if (!file) return;
        console.log("Uploading:", file.name);
        // Logic to send file to server goes here

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

    // const getImageURL = (imagePath: string) => {
    //     return getUrl({ path: imagePath })
    // }

    useEffect(() => {
        client.models.Post.observeQuery().subscribe({
            next: (post) => setPosts([...post.items]),
        });
    }, []);

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
                {posts.map((post) => (<li
                    // onClick={() => deleteTodo(todo.id)}
                    key={post.id}>
                    {post.imagePath ?? "***missing***"}
                </li>
                ))}
            </ul>
        </main>
    );
}

export default App;
