import { useEffect, useState, useRef } from "react";
import { getUrl } from "aws-amplify/storage";
import { PostDisplay, UserDisplay } from "./DataTypes";
import { formatTimeAgo } from "./utils/dateTimeFormat";

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


export const PostOptionsMenu = ({ 
  postID, 
  onDelete 
}: { 
  postID: string, 
  onDelete: (id: string) => void 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu if the user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleDeleteClick = () => {
    onDelete(postID);
    setIsOpen(false);
  };

  return (
    <div className="post-options-container" ref={menuRef}>
      <button 
        className="post-options-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Post options"
      >
        •••
      </button>

      {isOpen && (
        <div className="post-options-dropdown">
          <button className="dropdown-item text-danger" onClick={handleDeleteClick}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ marginRight: '8px' }}
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            Delete
          </button>
          {/* Add more options here later */}
          {/* <button className="dropdown-item">Edit</button> */}
        </div>
      )}
    </div>
  );
};

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
                  <p className="post-time">{formatTimeAgo(post.createdAt)}</p>
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
               <span className="post-action-btn">💬 {0}</span>
               <span className="post-action-btn">↗️ Share</span>
            </div>
          </div>
        ))}
        <div style={{ height: '20px' }}></div>
      </div>
    </div>
  );
};

export const MyPostsView = ( 
    { postsDisplay, onLike, onDelete } :
    { postsDisplay: PostDisplay[], onLike: (liked: boolean, postID: string) => void, onDelete: (postID: string) => void }
  ) => {
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
                  <p className="post-time">{formatTimeAgo(post.createdAt)}</p>
                </div>
              </div>
              <PostOptionsMenu postID={post.id} onDelete={onDelete} />
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
               <span className="post-action-btn">💬 {0}</span>
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