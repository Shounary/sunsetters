import { useEffect, useState } from "react";
import { getUrl } from "aws-amplify/storage";
import { PostDisplay, UserDisplay } from "./DataTypes";


export function AvatarImage({ imagePath }: { imagePath: string }) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    const fetchUrl = async () => {
        console.log(`Getting URL for: ${imagePath}`)
        try {
            const link = await getUrl({ path: imagePath })
            setSrc(link.url.toString());
            
        } catch (err) {
            console.error("Error signing URL", err);
        }
    };

    fetchUrl();
  }, [imagePath]);

  return <img src={src} alt="User Avatar" style={{ width: 500, height: 500, borderRadius: '50%' }} />;
}

export function FollowButton({ onClick, userID }: { onClick: (targetUserID: string) => Promise<void>, userID: string }) {
  const [ isClicked, setIsClicked ] = useState<boolean>(false);

  const onSingleClick = async (targetUserID: string) => {
      if (!isClicked) {
        onClick(targetUserID)
      }
      setIsClicked(true)
  }

  return <button style={{ 
                padding: '4px 12px', 
                borderRadius: '99px', 
                border: '1px solid #818cf8', 
                background: isClicked ? '#e0e7ff' : 'white',
                color: '#4f46e5',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
            }}

            onClick={
                () => onSingleClick(userID)
            }>

            {isClicked ? "Followed" : "Follow"}
        </button>;
}

export const FeedView = ( { feedDisplay } : {feedDisplay: PostDisplay[]}) => {
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

export const MyPostsView = ( { postsDisplay } : { postsDisplay: PostDisplay[] }) => {
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

export const FollowsView = ( { users, followUser } : { users: UserDisplay[], followUser: (targetUserID: string) => Promise<void> }) => (
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