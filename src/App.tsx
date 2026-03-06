import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { getUrl, uploadData, remove } from "aws-amplify/storage";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { PostDisplay, INewPost, UserDisplay } from "./DataTypes";
import { AvatarImage } from "./DisplayTypes";
import { UserEvent } from "../amplify/functions/common/types";
import { FeedView, MyPostsView, FollowsView } from "./DisplayTypes";
import { useImageUpload } from './hooks/useImageUpload';
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

    // Hook for New Posts
    const { 
        file: postImageFile, 
        previewUrl: postPreviewUrl, 
        isProcessing: isPostImageProcessing, 
        error: postImageError, 
        handleImageChange: handlePostImageSelect, 
        clearImage: clearPostImage 
    } = useImageUpload({ maxWidth: 1080, maxHeight: 1080, quality: 0.85 });

    // Hook for Profile Pictures
    const { 
        file: profileImageFile, 
        isProcessing: isProfileProcessing, 
        handleImageChange: handleProfileImageSelect, 
        clearImage: clearProfileImage 
    } = useImageUpload({ maxWidth: 400, maxHeight: 400, quality: 0.8 });



    // REACT STATES
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




    // CREATE A POST
    const handleNewPostTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewPost((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault()
        if (!postImageFile && newPost.textInput === '') return;

        // CREATE A POST
        // Create a dud post
        client.models.Post.create({
            owner: user.userId,
            content: newPost.textInput,
            likes: []
        }).then(async (post) => {
            if (!post.data) {
                console.warn("Post contains empty data!");
                return
            }
            // console.log(`File ${file.name} selected`)
            const postData = post.data
            if (!postImageFile) {
                console.log("The post included no media!")
                return
            }

            // Upload image to S3 storage
            await uploadData({
                path: `images/${post.data.id}-${postImageFile.name}`,
                data: postImageFile,
                options: {
                    contentType: postImageFile.type
                }
            }).result.then((uploaded) => {
                console.log(`Image ${uploaded.path} uploaded to storage`)

                // Update the dud post with S3 path
                client.models.Post.update({
                    id: postData.id,
                    content: postData.content,
                    imagePath: uploaded.path
                }).then(() => {
                    console.log(`Post for ${postImageFile.name} update with newly uploaded image ${uploaded.path}`)
                })

                client.models.UserPost.create({ postID: postData.id }).catch(() => {
                    console.error(`Could not create a UserPost entry with postID: ${postData.id}`)
                })

                console.log("Calling client.mutations on frontend")
                client.mutations.userEvent({ userEvent: UserEvent.ADD_POST_TO_FEED, originUserID: user.userId, newPostID: postData.id })


                // Clear the text and reset the image hook
                setNewPost({ textInput: '', imageInput: null })
                clearPostImage();
            })
        })
    }

    // CHANGE PROFILE IMAGE
    // Listen for when the hook successfully finishes processing a new profile image
    useEffect(() => {
        const uploadProfilePicture = async () => {
            if (!profileImageFile || !userProfile) return;

            try {
                const uploadResult = await uploadData({
                    path: `profile-pictures/${userProfile.id}-${Date.now()}-${profileImageFile.name}`,
                    data: profileImageFile,
                    options: {
                        contentType: profileImageFile.type 
                    }
                }).result;

                console.log(`Profile image uploaded to ${uploadResult.path}`);

                
                if (userProfile.imagePath) {
                    remove({ path: userProfile.imagePath }).catch(console.error);
                    console.log(`Removed old profile image ${userProfile.imagePath}`);
                }

                await client.models.UserProfile.update({
                    id: userProfile.id,
                    imagePath: uploadResult.path
                });

                clearProfileImage();
                
            } catch (error) {
                console.error("Failed to update profile image:", error);
            }
        };

        uploadProfilePicture();
    }, [profileImageFile, userProfile, clearProfileImage]);


    // DELETE POST
    const deletePost = async (postID: string) => {
        try {
            const post = await client.models.Post.get({ id: postID })

            if (!post?.data) {
                console.warn(`Could not find post ${postID} to delete!`)
                return
            }

            if (post.data.imagePath) {
                remove({ path: post.data.imagePath })
            }

            await client.models.UserPost.delete({ id: postID })

            await client.models.Post.delete({ id: postID })

            setPostsDisplay((prev) => prev.filter((p) => p.id !== postID))
        } catch(error) {
            console.error(`Error deleting post: ${error}`)
        }
    }

    // FOLLOW USER
    const followUser = async (targetUserID: string) => {
        client.mutations.userEvent( {
            userEvent: UserEvent.FOLLOW_USER,
            originUserID: user.userId,
            targetUserID: targetUserID
        })
    }

    // LIKE/UNLIKE
    const onLike = async (newLikeState: boolean, postID: string) => {
        const post = await client.models.Post.get({ id: postID })
        console.log("getting post to like/dislike")
        if (!post?.data) {
            throw Error(`Failed to find post ${postID} to like!`)
        }
        let likes = post.data.likes
        if (newLikeState) {
            if (!likes.includes(user.userId)) {
                console.log("Liking a post")
                likes.push(user.userId)
            }
        } else {
            console.log("Disliking a post")
            likes = await likes.filter(p => p != user.userId)
        }
        console.log(`New likes: ${likes}`)

        await client.models.Post.update({ 
            id: postID,
            likes: likes
        })
    }

    // FEED DISPLAY
    const extractFeed = async () => {
        const postFeed = await fetchUserFeed();
        
        const feedPromises = postFeed.map(async (post) => {
            if (!post?.imagePath) return null;
            
            const imageURL = await getUrl({ path: post.imagePath });
            const postOwner = await client.models.UserProfile.get({ id: post.owner });

            if (!postOwner?.data) {
                console.warn(`Cannot find post ${post.id} owner`);
                return null;
            }

            const postDisplay: PostDisplay = {
                id: post.id,
                ownerID: postOwner.data.id,
                ownerName: postOwner.data.name,
                ownerImagePath: postOwner.data.imagePath,
                createdAt: post.createdAt,
                content: post.content ?? "",
                mediaURLs: [imageURL.url],
                likes: post.likes.length,
                wasLiked: post.likes.includes(user.userId)
            };
            
            return postDisplay;
        });

        const resolvedFeed = await Promise.all(feedPromises);

        const finalFeed = resolvedFeed.filter(p => p !== null) as PostDisplay[];

        setFeedDisplay(finalFeed);
    }

    // POSTS DISPLAY
    const extractPosts = async () => {
        const posts = await fetchUserPosts()
        
        const postPromises = posts.map(async (post) => {
            if (!post?.imagePath) return null;
            
            const imageURL = await getUrl({ path: post.imagePath });
            const postOwner = await client.models.UserProfile.get({ id: post.owner });

            if (!postOwner?.data) {
                console.warn(`Cannot find post ${post.id} owner`);
                return null;
            }

            const postDisplay: PostDisplay = {
                id: post.id,
                ownerID: postOwner.data.id,
                ownerName: postOwner.data.name,
                ownerImagePath: postOwner.data.imagePath,
                createdAt: post.createdAt,
                content: post.content ?? "",
                mediaURLs: [imageURL.url],
                likes: post.likes.length,
                wasLiked: post.likes.includes(user.userId)
            };
            
            return postDisplay;
        });

        const resolvedPosts = await Promise.all(postPromises);

        const finalPosts = resolvedPosts.filter(p => p !== null) as PostDisplay[];

        setPostsDisplay(finalPosts);
    }


    // USERS TO FOLLOW DISPLAY
    const extractUsersToFollow = async (currentUser: Schema["UserProfile"]["type"]) => {
        const unfollowedUsers = await fetchUsersToFollow(currentUser);
        
        const userPromises = unfollowedUsers.map(async (u) => {
            if (!u) return null;
            
            try {
                const pfpURL = await getUrl({ path: u.imagePath });
                
                const userDisplay: UserDisplay = {
                    id: u.id,
                    name: u.name,
                    profilePicture: pfpURL.url
                };
                
                return userDisplay;
            } catch (error) {
                console.warn(`Failed to load profile picture for user ${u.id}`, error);
                return null;
            }
        });

        const resolvedUsers = await Promise.all(userPromises);
        
        const finalUsers = resolvedUsers.filter(u => u !== null) as UserDisplay[];
        
        setUsersToFollow(finalUsers);
    }

    useEffect(() => {
        const postSub = client.models.UserPost.observeQuery().subscribe({
            next: async () => await extractPosts(),
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




    // FRONTEND
    const renderContent = () => {
        switch (currentTab) {
            case "Feed": return <FeedView feedDisplay={feedDisplay} onLike={onLike}/>;
            case "My Posts": return <MyPostsView postsDisplay={postsDisplay} onLike={onLike} onDelete={deletePost}/>;
            case "Follows": return <FollowsView users={usersToFollow} followUser={followUser}/>;
            default: return null;
        }
    };

    return (
        <main className="app-container">
            
            <header className="main-top-header">
                <h1 className="header-title">
                    Sun<span className="highlight">Setters</span>
                </h1>

                <div className="header-actions">
                    <button className="btn-secondary" onClick={signOut}>Sign Out</button>
                    <div className="user-info">
                        
                        {/* Wrap the avatar in a label tied to the hidden input */}
                        <label htmlFor="profile-upload" className="avatar-upload-label" title="Change Profile Picture">
                            {userProfile?.imagePath ? (
                                <div className="avatar-wrapper">
                                    <AvatarImage imagePath={userProfile.imagePath} />
                                </div>
                            ) : (
                                <div className="avatar placeholder avatar-wrapper" />
                            )}
                            
                            {/* Hover overlay with a camera icon */}
                            <div className="avatar-hover-overlay">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" 
                                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                    <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                            </div>
                        </label>

                        {/* The hidden file input */}
                        <input 
                            type="file" 
                            id="profile-upload" 
                            style={{ display: 'none' }} 
                            accept="image/jpeg, image/png, image/webp, image/gif"
                            onChange={handleProfileImageSelect}
                            disabled={isProfileProcessing}
                        />
                    </div>
                </div>
            </header>

            <div className="interactive-section">
                <div className="create-post-card">
                    <form onSubmit={handleUpload} className="create-post-form">
                        <div className="input-group">
                            <input 
                                type="text" 
                                name="textInput"
                                value={newPost.textInput} 
                                onChange={handleNewPostTextChange} 
                                placeholder="Have you seen a sunset?"
                                className="text-input"
                                required
                            />
                        </div>

                        {/* Surface hook validation errors to the user */}
                        {postImageError && <p style={{ color: 'red', fontSize: '0.9em', margin: '5px 0' }}>{postImageError}</p>}

                        <div className="form-bottom-row">
                            <div className="media-section">
                                <input 
                                    type="file" 
                                    name="imageInput" 
                                    onChange={handlePostImageSelect} 
                                    className="file-input"
                                    id="file-upload"
                                    accept="image/jpeg, image/png, image/webp, image/gif"
                                    disabled={isPostImageProcessing}
                                />

                                {isPostImageProcessing ? (
                                    <div 
                                        className="small-preview-wrapper" 
                                        style={{ 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            gap: '8px',
                                            color: '#666' // Matches standard secondary text
                                        }}
                                    >
                                        {/* Animated SVG Spinner */}
                                        <svg 
                                            width="28" 
                                            height="28" 
                                            viewBox="0 0 24 24" 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            stroke="currentColor" 
                                            fill="none"
                                        >
                                            {/* Faded background track */}
                                            <circle cx="12" cy="12" r="10" strokeWidth="3" stroke="rgba(0,0,0,0.1)" />
                                            {/* Spinning active segment */}
                                            <path d="M12 2 a10 10 0 0 1 10 10" strokeWidth="3" strokeLinecap="round">
                                                <animateTransform 
                                                    attributeName="transform" 
                                                    type="rotate" 
                                                    from="0 12 12" 
                                                    to="360 12 12" 
                                                    dur="0.8s" 
                                                    repeatCount="indefinite" 
                                                />
                                            </path>
                                        </svg>
                                    </div>
                                ) : postPreviewUrl ? (
                                    <div className="small-preview-wrapper">
                                        <img src={postPreviewUrl} alt="Upload Preview" className="small-image-preview" />
                                        <button type="button" onClick={clearPostImage} className="small-clear-btn" aria-label="Remove image">
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <label htmlFor="file-upload" className="square-file-label" aria-label="Attach Media">
                                        <svg className="plus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                    </label>
                                )}
                            </div>
                            <button type="submit" className="btn-primary" disabled={isPostImageProcessing}>Post</button>
                        </div>
                    </form>
                </div>
                
                <NavigationBar 
                    tabs={["Feed", "My Posts", "Follows"]} 
                    activeTab={currentTab} 
                    onTabChange={setCurrentTab} 
                />
            </div>

            {/* 3. Scrollable Content Area */}
            <div className="main-content-scroll-area">
                {renderContent()}
            </div>
            
        </main>
    );

}

export default App;
