import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { getUrl, uploadData } from "aws-amplify/storage";
// import { remove } from "aws-amplify/storage";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { PostDisplay, INewPost, UserDisplay } from "./DataTypes";
import { AvatarImage, FollowButton } from "./DisplayTypes";
import { UserEvent } from "../amplify/functions/common/types";
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

    async function fetchUsersToFollow() {
        const { data: users } =  await client.models.UserProfile.list({
            limit: 10
        })
        
        const unfollowedUsers = users
            .filter(user => !userProfile?.followers?.includes(user.id))
        
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

    // // FRONTEND
    const [currentTab, setCurrentTab] = useState("Feed");

    const renderContent = () => {
        switch (currentTab) {
            case "Feed": return <FeedView feedDisplay={feedDisplay}/>;
            case "My Posts": return <MyPostsView postsDisplay={postsDisplay}/>;
            case "Follows": return <FollowsView users={usersToFollow} followUser={followUser}/>;
            default: return null;
        }
    };


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

    const extractUsersToFollow = async () => {
        const usersToFollow = await fetchUsersToFollow()
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

        // const feedSub = client.models.FeedPost.observeQuery({
        //     filter: {
        //         id: { eq: user.userId }
        //     }
        // }).subscribe({
        //     next: () => extractFeed(),
        // })

        
        const userSub = client.models.UserProfile.observeQuery({
            filter: { 
                id: { eq: user.userId } 
            }
        }).subscribe({
            next: ({ items }) => {
                console.log(`Fetching user by id: ${user.userId}`)
                setUserProfile(items[0]);
                extractFeed()
                extractUsersToFollow()
            }
        })

        return () => {
            postSub.unsubscribe()
            // feedSub.unsubscribe()
            userSub.unsubscribe()
        }
    }, [])

    return (
        <main>
        <div>------</div>
        <div>------</div>
        <div>------</div>
        <div>------</div>
        <div>------</div>
        <h1>Welcome {user?.signInDetails?.loginId}</h1>
        <div>
            {userProfile?.imagePath && (
            <AvatarImage imagePath={userProfile.imagePath} />
            )}
        </div>
        <h2>Image: {userProfile?.imagePath}</h2>

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
        <button onClick={ signOut }>SIGN OUT</button>

        <div className="app-container">
        <div className="header-section">
            <h1 className="title">
            Sun<span className="highlight">Setters</span>
            </h1>
            
            <NavigationBar 
            tabs={["Feed", "My Posts", "Follows"]} 
            activeTab={currentTab} 
            onTabChange={setCurrentTab} 
            />
        </div>

        {renderContent()}
        </div>
        </main>
    );
    
    // return (
    //     <main>
    //         <h1>Welcome {user?.signInDetails?.loginId}</h1>
    //         <div>
    //             {userProfile?.imagePath && (
    //             <AvatarImage imagePath={userProfile.imagePath} />
    //             )}
    //         </div>
    //         <h2>Image: {userProfile?.imagePath}</h2>
    //         <button onClick={ signOut }>SIGN OUT</button>

    //         <form onSubmit={handleUpload}>
    //             <div>
    //                 <label>Text:</label>
    //                 <input 
    //                     type="text" 
    //                     name="textInput"
    //                     value={newPost.textInput} 
    //                     onChange={handleNewPostChange} 
    //                 />
    //             </div>

    //             <div>
    //                 <label>Media:</label>
    //                 <input 
    //                     type="file" 
    //                     name="imageInput" 
    //                     onChange={handleNewPostChange} 
    //                 />
    //             </div>

    //             <button type="submit">Post</button>
    //         </form>

    //         <ul>
    //             {feedDisplay.map((displayPost) => (<li
    //                 onClick={() => deletePost(displayPost.id)}
    //                 key={displayPost.id}>
    //                 <div className="image-container">
    //                     <img 
    //                         src={displayPost.mediaURLs[0].toString()} 
    //                         alt={displayPost.mediaURLs[0].toString()} 
    //                         style={{ width: '100%', height: '250px', borderRadius: '8px' }} 
    //                     />
    //                     <h3>{displayPost.content}</h3>
    //                 </div>
    //             </li>
    //             ))}
    //         </ul>
    //     </main>
    // );

}

const FeedView = ( { feedDisplay } : {feedDisplay: PostDisplay[]}) => {
  return (
    // 2. Wrap in the 'feed-mask' for the visual fade effect at the bottom
    <div className="feed-mask view-wrapper">
      
      {/* 3. The Scroll Container */}
      <div className="feed-scroll-view">
        {feedDisplay.map((post: PostDisplay) => (
          <div key={post.id} className="feed-card">
            <div className="card-header">
              <div className="user-info">
                <div 
                  className="avatar" 
                //   style={{ 
                //     // Alternate colors for variety
                //     background: i % 3 === 0 ? '#ec4899' : i % 3 === 1 ? '#8b5cf6' : '#3b82f6' 
                //   }} 
                />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{post.id}</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                    {10}m ago
                  </p>
                </div>
              </div>
              <span style={{ color: '#9ca3af' }}>•••</span>
            </div>
            
            <img 
                src={post.mediaURLs[0].toString()} 
                alt={post.mediaURLs[0].toString()} 
                style={{ width: '100%', height: '250px', borderRadius: '8px' }} 
            />
            
            <div style={{ display: 'flex', gap: '1.5rem', color: '#4b5563', fontSize: '0.9rem' }}>
               <span style={{ cursor: 'pointer' }}>❤️ {100}</span>
               <span style={{ cursor: 'pointer' }}>💬 {20}</span>
               <span style={{ cursor: 'pointer' }}>↗️ Share</span>
            </div>
          </div>
        ))}
        
        {/* End of list spacer */}
        <div style={{ height: '20px' }}></div>
      </div>
    </div>
  );
};

const MyPostsView = ( { postsDisplay } : { postsDisplay: PostDisplay[] }) => {
  // 1. Create a larger list of items to ensure scrolling triggers

  return (
    // 2. Wrap in the 'feed-mask' for the visual fade effect at the bottom
    <div className="feed-mask view-wrapper">
      
      {/* 3. The Scroll Container */}
      <div className="feed-scroll-view">
        {postsDisplay.map((post: PostDisplay) => (
          <div key={post.id} className="feed-card">
            <div className="card-header">
              <div className="user-info">
                <div 
                  className="avatar" 
                //   style={{ 
                //     // Alternate colors for variety
                //     background: i % 3 === 0 ? '#ec4899' : i % 3 === 1 ? '#8b5cf6' : '#3b82f6' 
                //   }} 
                />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{post.id}</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                    {10}m ago
                  </p>
                </div>
              </div>
              <span style={{ color: '#9ca3af' }}>•••</span>
            </div>
            
            <img 
                src={post.mediaURLs[0].toString()} 
                alt={post.mediaURLs[0].toString()} 
                style={{ width: '100%', height: '250px', borderRadius: '8px' }} 
            />

            {post.content}
            
            <div style={{ display: 'flex', gap: '1.5rem', color: '#4b5563', fontSize: '0.9rem' }}>
               <span style={{ cursor: 'pointer' }}>❤️ {100}</span>
               <span style={{ cursor: 'pointer' }}>💬 {20}</span>
               <span style={{ cursor: 'pointer' }}>↗️ Share</span>
            </div>
          </div>
        ))}
        
        {/* End of list spacer */}
        <div style={{ height: '20px' }}></div>
      </div>
    </div>
  );
};

const FollowsView = ( { users, followUser } : { users: UserDisplay[], followUser: (targetUserID: string) => Promise<void> }) => (
    <div className="view-wrapper">
        {users.map(user => (
        <div key={user.id} className="list-item">
            <div className="user-info">
            {/* <div className="avatar" style={{ background: i % 2 === 0 ? '#818cf8' : '#f472b6' }} /> */}
            <div> <img className="avatar" src={user.profilePicture.toString()} alt="pfp" /></div>
            <div>
                <h4 style={{ margin: 0 }}>{user.name}</h4>
                <small style={{ color: '#6b7280' }}>@user_{user.name.split(' ')[0].toLowerCase()}</small>
            </div>
            </div>
            <FollowButton onClick={followUser} userID = {user.id}></FollowButton>
        </div>
        ))}
    </div>
);

export default App;
