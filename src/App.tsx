import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from "@aws-amplify/ui-react";

const client = generateClient<Schema>();

function App() {
    const [file, setFile] = useState<File | null>(null);
    const { user, signOut } = useAuthenticator()

    // const newPost = client.models.Post.create({
    //     // timestamp: new Date().getUTCDate().toString()
    //     content: "Created a static test post with custom image"
    // }).then((post) => {
    //     if (!post.data) {
    //         // log something
    //         return
    //     }
    //     const imgUpload = uploadData({
    //         path: `images/${post.data.id}-${file.name}`,
    //         data: file,
    //         options: {
    //             contentType: "image/png"
    //         }
    //     })
    // })


    const handleFileChange = (f: any) => {
        // files is an array-like object; we usually want the first one
        setFile(f.target.files[0]);
    };

    const handleUpload = () => {
        if (!file) return;
        console.log("Uploading:", file.name);
        // Logic to send file to server goes here
    };

    return (
        <main>
            <h1>Welcome {user?.signInDetails?.loginId}</h1>
            <button onClick={ signOut }>SIGN OUT</button>

            <div className="upload-container">
                <input type="file" onChange={handleFileChange} />
                <button onClick={handleUpload}>Upload</button>
                {file && <p>Selected: {file.name}</p>}
            </div>
        </main>
    );
}

export default App;
