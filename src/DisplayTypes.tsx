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

  return <img src={src} alt="User Avatar" className="avatar-image-large" />;
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

export const FeedView = ( { feedDisplay } : {feedDisplay: PostDisplay[]}) => {
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
               <span className="post-action-btn heart">❤️ {100}</span>
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

export const MyPostsView = ( { postsDisplay } : { postsDisplay: PostDisplay[] }) => {
  return (
    <div className="feed-mask view-wrapper">
      <div className="feed-scroll-view">
        {postsDisplay.map((post: PostDisplay) => (
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

            <div className="post-text-content">
              {post.content}
            </div>
            
            {/* Added a custom style to override margin-top if needed, or you can just let .post-actions handle it */}
            <div className="post-actions" style={{ marginTop: 0 }}>
               <span className="post-action-btn heart">❤️ {100}</span>
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