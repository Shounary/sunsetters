import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { getUrl, uploadData } from "aws-amplify/storage";
// import { remove } from "aws-amplify/storage";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { PostDisplay, INewPost, UserDisplay } from "./DataTypes";
import { AvatarImage } from "./DisplayTypes";
import { UserEvent } from "../amplify/functions/common/types";
import { FeedView, MyPostsView, FollowsView } from "./DisplayTypes";
import NavigationBar from "./NavigationBar";

function App() {
    const client = generateClient<Schema>();

    async function fetchUserPosts() {
        const { data: userPosts } = await client.models.UserPost.list()
        const fetch = userPosts.map(post => 
            client.models.Post.get({ id: post.postID })
        )
        
        const rawPosts = await Promise.all(fetch)

        const posts = rawPosts
            .map(r => r.data)
            .filter(item => item !== null)
        
        const sortedPosts = posts.sort( (a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        return sortedPosts
    }

    // TODO: add wasViewedCheck

    async function fetchUserFeed() {
        const { data: userFeed } = await client.models.FeedPost.list()
        const fetch = userFeed.map(post => 
            client.models.Post.get({ id: post.postID })
        )

        const rawFeed = await Promise.all(fetch)

        const feed = rawFeed
            .map(r => r.data)
            .filter(item => item !== null)

        const sortedFeed = feed.sort( (a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        return sortedFeed
    }

    async function fetchUsersToFollow(currentUser: Schema["UserProfile"]["type"]) {
        const { data: users } =  await client.models.UserProfile.list({
            limit: 10
        })

        const unfollowedUsers = users
            .filter(user => !currentUser.follows?.includes(user.id) && user.id !== currentUser.id)
        
        return unfollowedUsers
    }
    

    const [newPost, setNewPost] = useState<INewPost>({
        textInput: '',
        imageInput: null
    })
    const [feedDisplay, setFeedDisplay] = useState<Array<PostDisplay>>([])
    const [postsDisplay, setPostsDisplay] = useState<Array<PostDisplay>>([])
    const [usersToFollow, setUsersToFollow] = useState<Array<UserDisplay>>([])

    const [userProfile, setUserProfile] = useState<Schema["UserProfile"]["type"]>()
    const { user, signOut } = useAuthenticator()

    // FRONTEND
    const [currentTab, setCurrentTab] = useState("Feed");




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
            owner: user.userId,
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

                client.models.UserPost.create({ postID: postData.id }).catch(() => {
                    console.error(`Could not create a UserPost entry with postID: ${postData.id}`)
                })

                console.log("Calling client.mutations on frontend")
                client.mutations.userEvent({ userEvent: UserEvent.ADD_POST_TO_FEED, originUserID: user.userId, newPostID: postData.id })
            })
        })
    }


    // DELETE POST
    // const deletePost = (id: string) => {
    //     client.models.UserPost.delete({ id: id })
    //     client.models.Post.get({ id: id }).then((post) => {
    //         if (!post || !post.data?.imagePath) {
    //            console.warn(`Could not find post with id ${id} to delete!`)
    //            return
    //         }
    //         client.models.Post.delete({ id: id })
    //         setFeedDisplay((prev) => prev.filter((f) => f.id !== id))
    //         remove({ path: post.data?.imagePath })
    //     })
    // }

    // FOLLOW USER
    const followUser = async (targetUserID: string) => {
        client.mutations.userEvent( {
            userEvent: UserEvent.FOLLOW_USER,
            originUserID: user.userId,
            targetUserID: targetUserID
        })
    }


    // FEED DISPLAY
    const extractFeed = async () => {
        const postFeed = await fetchUserFeed()
        postFeed.forEach(async post => {
            setFeedDisplay([])
            if (!post?.imagePath) return
            const imageURL = await getUrl({ path: post.imagePath })
            const postDisplay: PostDisplay = {
                id: post.id,
                content: post.content ?? "",
                mediaURLs: [imageURL.url]
            }
            setFeedDisplay((prev) => [...prev, postDisplay])
        });
    }

    // POSTS DISPLAY
    const extractPosts = async () => {
        const postFeed = await fetchUserPosts()
        console.log(`fetching posts of length: ${postFeed.length}`)
        postFeed.forEach(async post => {
            console.log(post)
            setPostsDisplay([])
            if (!post?.imagePath) return
            const imageURL = await getUrl({ path: post.imagePath })
            const postDisplay: PostDisplay = {
                id: post.id,
                content: post.content ?? "",
                mediaURLs: [imageURL.url]
            }
            setPostsDisplay((prev) => [...prev, postDisplay])
        });
    }

    // USERS TO FOLLOW DISPLAY
    const extractUsersToFollow = async (currentUser: Schema["UserProfile"]["type"]) => {
        const usersToFollow = await fetchUsersToFollow(currentUser)
        usersToFollow.forEach(async u => {
            setUsersToFollow([])
            if (!u) return
            const pfpURL = await getUrl({ path: u.imagePath })
            const userDisplay: UserDisplay = {
                id: u.id,
                name: u.name,
                profilePicture: pfpURL.url
            }
            setUsersToFollow((prev) => [...prev, userDisplay])
        });
    }

    useEffect(() => {
        const postSub = client.models.UserPost.observeQuery().subscribe({
            next: () => extractPosts(),
        })
        
        const userSub = client.models.UserProfile.observeQuery({
            filter: { 
                id: { eq: user.userId } 
            }
        }).subscribe({
            next: async ({ items }) => {
                const fetchedUserProfile = items[0]
                console.log(`Fetching user by id: ${user.userId}`)
                await setUserProfile(fetchedUserProfile);
                await extractFeed()
                await extractUsersToFollow(fetchedUserProfile)
            }
        })

        return () => {
            postSub.unsubscribe()
            userSub.unsubscribe()
        }
    }, [])


    // const renderContent = () => {
    //     switch (currentTab) {
    //         case "Feed": return <FeedView feedDisplay={feedDisplay}/>;
    //         case "My Posts": return <MyPostsView postsDisplay={postsDisplay}/>;
    //         case "Follows": return <FollowsView users={usersToFollow} followUser={followUser}/>;
    //         default: return null;
    //     }
    // };

    // return (
    //     <main>
    //     <div>------</div>
    //     <div>------</div>
    //     <div>------</div>
    //     <div>------</div>
    //     <div>------</div>
    //     <h1>Welcome {user?.signInDetails?.loginId}</h1>
    //     <div>
    //         {userProfile?.imagePath && (
    //         <AvatarImage imagePath={userProfile.imagePath} />
    //         )}
    //     </div>
    //     <h2>Image: {userProfile?.imagePath}</h2>

    //     <form onSubmit={handleUpload}>
    //         <div>
    //             <label>Text:</label>
    //             <input 
    //                 type="text" 
    //                 name="textInput"
    //                 value={newPost.textInput} 
    //                 onChange={handleNewPostChange} 
    //             />
    //         </div>

    //         <div>
    //             <label>Media:</label>
    //             <input 
    //                 type="file" 
    //                 name="imageInput" 
    //                 onChange={handleNewPostChange} 
    //             />
    //         </div>

    //         <button type="submit">Post</button>
    //     </form>
    //     <button onClick={ signOut }>SIGN OUT</button>

    //     <div className="app-container">
    //     <div className="header-section">
    //         <h1 className="title">
    //         Sun<span className="highlight">Setters</span>
    //         </h1>
            
    //         <NavigationBar 
    //         tabs={["Feed", "My Posts", "Follows"]} 
    //         activeTab={currentTab} 
    //         onTabChange={setCurrentTab} 
    //         />
    //     </div>

    //     {renderContent()}
    //     </div>
    //     </main>
    // );

    const renderContent = () => {
        switch (currentTab) {
            case "Feed": return <FeedView feedDisplay={feedDisplay}/>;
            case "My Posts": return <MyPostsView postsDisplay={postsDisplay}/>;
            case "Follows": return <FollowsView users={usersToFollow} followUser={followUser}/>;
            default: return null;
        }
    };

    return (
        <main className="app-container">
            
            {/* Top Bar: User Profile & Sign Out */}
            <div className="top-profile-bar">
                <div className="user-info">
                    {userProfile?.imagePath ? (
                        <div className="avatar-wrapper">
                            <AvatarImage imagePath={userProfile.imagePath} />
                        </div>
                    ) : (
                        <div className="avatar placeholder" />
                    )}
                    <div className="user-details">
                        <h2 className="welcome-text">Welcome, {user?.signInDetails?.loginId}</h2>
                    </div>
                </div>
                <button className="btn-secondary" onClick={signOut}>SIGN OUT</button>
            </div>

            <div className="header-section">
                
                {/* App Title */}
                <h1 className="title">
                    Sun<span className="highlight">Setters</span>
                </h1>

                {/* Create Post Form (Above Navigation) */}
                <div className="create-post-card">
                    <form onSubmit={handleUpload} className="create-post-form">
                        <div className="input-group">
                            <input 
                                type="text" 
                                name="textInput"
                                value={newPost.textInput} 
                                onChange={handleNewPostChange} 
                                placeholder="Have you seen a sunset?"
                                className="text-input"
                                required
                            />
                        </div>

                        <div className="form-actions">
                            <div className="file-input-wrapper">
                                <input 
                                    type="file" 
                                    name="imageInput" 
                                    onChange={handleNewPostChange} 
                                    className="file-input"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="file-label">
                                    📷 Attach Media
                                </label>
                            </div>
                            
                            <button type="submit" className="btn-primary">Post</button>
                        </div>
                    </form>
                </div>
                
                {/* Navigation Bar */}
                <NavigationBar 
                    tabs={["Feed", "My Posts", "Follows"]} 
                    activeTab={currentTab} 
                    onTabChange={setCurrentTab} 
                />
            </div>

            {/* Scrollable Content */}
            {renderContent()}
        </main>
    );

}

export default App;
