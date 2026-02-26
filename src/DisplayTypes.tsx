import { useEffect, useState } from "react";
import { getUrl } from "aws-amplify/storage";
import { PostDisplay, UserDisplay } from "./DataTypes";

export function AvatarImage({ imagePath }: { imagePath: string }) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    const fetchUrl = async () => {
        try {
            const link = await getUrl({ path: imagePath })
            setSrc(link.url.toString());
        } catch (err) {
            console.error("Error signing URL", err);
        }
    };
    fetchUrl();
  }, [imagePath]);

  return <img src={src} alt="User Avatar" className="avatar-image" />;
}

export function FollowButton({ onClick, userID }: { onClick: (targetUserID: string) => Promise<void>, userID: string }) {
  const [ isClicked, setIsClicked ] = useState<boolean>(false);

  const onSingleClick = async (targetUserID: string) => {
      if (!isClicked) {
        onClick(targetUserID)
      }
      setIsClicked(true)
  }

  return (
        <button 
            /* Dynamic class name: adds 'active' class when clicked */
            className={`btn-follow ${isClicked ? 'active' : ''}`}
            onClick={() => onSingleClick(userID)}
        >
            {isClicked ? "Followed" : "Follow"}
        </button>
  );
}

export function LikeButton({ post, onLike }:
    { post: PostDisplay, onLike?: (liked: boolean, postID: string) => void }) {
  const [ wasLiked, setWasLiked ] = useState(post.wasLiked);
  const [likes, setLikes] = useState(post.likes);

  const handleToggleLike = () => {
    const newState = !post.wasLiked

    // changing local display vars
    setWasLiked(newState);
    setLikes(newState ? likes + 1 : likes - 1);

    // changing post display vars
    post.wasLiked = newState
    post.likes = newState ? post.likes + 1: post.likes - 1
    
    if (onLike) {
      onLike(newState, post.id);
    }
  };

  return (
    <button 
      className={`like-btn ${wasLiked ? 'liked' : ''}`}
      onClick={handleToggleLike}
    >
      <svg 
        className="sun-icon" 
        viewBox="0 0 24 24" 
        fill={wasLiked ? "currentColor" : "none"} 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        {/* The center body of the sun */}
        <circle cx="12" cy="12" r="5" />
        
        {/* The 8 sun rays */}
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
      <span className="like-count">{likes}</span>
    </button>
  );
}

export const FeedView = ( { feedDisplay, onLike } : {feedDisplay: PostDisplay[], onLike: (liked: boolean, postID: string) => void }) => {
  return (
    <div className="feed-mask view-wrapper">
      <div className="feed-scroll-view">
        {feedDisplay.map((post: PostDisplay) => (
          <div key={post.id} className="feed-card">
            <div className="card-header">
              <div className="user-info">
                <div className="avatar" />
                <div>
                  <h4 className="post-author-name">{post.id}</h4>
                  <p className="post-time">10m ago</p>
                </div>
              </div>
              <span className="post-options-icon">•••</span>
            </div>
            
            <img 
                src={post.mediaURLs[0].toString()} 
                alt={post.mediaURLs[0].toString()} 
                className="post-media-img"
            />
            
            <div className="post-actions">
               <LikeButton post={post} onLike={onLike} />
               <span className="post-action-btn">💬 {20}</span>
               <span className="post-action-btn">↗️ Share</span>
            </div>
          </div>
        ))}
        <div style={{ height: '20px' }}></div>
      </div>
    </div>
  );
};

export const MyPostsView = ( { postsDisplay, onLike } : { postsDisplay: PostDisplay[], onLike: (liked: boolean, postID: string) => void  }) => {
  return (
    <div className="feed-mask view-wrapper">
      <div className="feed-scroll-view">
        {postsDisplay.map((post: PostDisplay) => (
          <div key={post.id} className="feed-card">
            <div className="card-header">
              <div className="user-info">
                <div className="avatar-wrapper">
                  <AvatarImage imagePath={post.ownerImagePath}></AvatarImage>
                </div>
                <div>
                  <h4 className="post-author-name">{post.ownerName}</h4>
                  <p className="post-time">10m ago</p>
                </div>
              </div>
              <span className="post-options-icon">•••</span>
            </div>
            
            <img 
                src={post.mediaURLs[0].toString()} 
                alt={post.mediaURLs[0].toString()} 
                className="post-media-img"
            />

            <div className="post-text-content">
              {post.content}
            </div>
            
            {/* Added a custom style to override margin-top if needed, or you can just let .post-actions handle it */}
            <div className="post-actions" style={{ marginTop: 0 }}>
               <LikeButton post={post} onLike={onLike} />
               <span className="post-action-btn">💬 {20}</span>
               <span className="post-action-btn">↗️ Share</span>
            </div>
          </div>
        ))}
        <div style={{ height: '20px' }}></div>
      </div>
    </div>
  );
};

export const FollowsView = ( { users, followUser } : { users: UserDisplay[], followUser: (targetUserID: string) => Promise<void> }) => (
    <div className="view-wrapper">
        {users.map(user => (
        <div key={user.id} className="list-item">
            <div className="user-info">
            <div> <img className="avatar" src={user.profilePicture.toString()} alt="pfp" /></div>
            <div>
                <h4 className="follow-user-name">{user.name}</h4>
                <small className="follow-user-handle">@user_{user.name.split(' ')[0].toLowerCase()}</small>
            </div>
            </div>
            <FollowButton onClick={followUser} userID={user.id}></FollowButton>
        </div>
        ))}
    </div>
);