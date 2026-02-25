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

  return (
        <button style={{ 
                padding: '4px 12px', 
                borderRadius: '99px', 
                border: isClicked ? '1px solid #F7AF4B' : '1px solid #A7CCED', 
                /* Highlight orange if clicked, Medium Blue if not */
                background: isClicked ? '#F7AF4B' : '#82A0BC',
                /* Dark text on Orange, White text on Blue */
                color: isClicked ? '#545E75' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: 600,
                fontSize: '0.8rem'
            }}
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
                  {/* Changed to White */}
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white' }}>{post.id}</h4>
                  {/* Changed to Light Blue */}
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#A7CCED' }}>
                    10m ago
                  </p>
                </div>
              </div>
              <span style={{ color: '#82A0BC' }}>•••</span>
            </div>
            
            <img 
                src={post.mediaURLs[0].toString()} 
                alt={post.mediaURLs[0].toString()} 
                style={{ width: '100%', height: '250px', borderRadius: '8px' }} 
            />
            
            {/* Action buttons changed to Light Blue */}
            <div style={{ display: 'flex', gap: '1.5rem', color: '#A7CCED', fontSize: '0.9rem', marginTop: '1rem' }}>
               <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#F7AF4B'} onMouseOut={e => e.currentTarget.style.color = '#A7CCED'}>❤️ {100}</span>
               <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'white'} onMouseOut={e => e.currentTarget.style.color = '#A7CCED'}>💬 {20}</span>
               <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'white'} onMouseOut={e => e.currentTarget.style.color = '#A7CCED'}>↗️ Share</span>
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
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white' }}>{post.id}</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#A7CCED' }}>
                    10m ago
                  </p>
                </div>
              </div>
              <span style={{ color: '#82A0BC' }}>•••</span>
            </div>
            
            <img 
                src={post.mediaURLs[0].toString()} 
                alt={post.mediaURLs[0].toString()} 
                style={{ width: '100%', height: '250px', borderRadius: '8px', marginBottom: '0.5rem' }} 
            />

            {/* Changed post text to White */}
            <div style={{ color: 'white', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {post.content}
            </div>
            
            <div style={{ display: 'flex', gap: '1.5rem', color: '#A7CCED', fontSize: '0.9rem' }}>
               <span style={{ cursor: 'pointer' }}>❤️ {100}</span>
               <span style={{ cursor: 'pointer' }}>💬 {20}</span>
               <span style={{ cursor: 'pointer' }}>↗️ Share</span>
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
                {/* Changed to White and Light Blue */}
                <h4 style={{ margin: 0, color: 'white' }}>{user.name}</h4>
                <small style={{ color: '#A7CCED' }}>@user_{user.name.split(' ')[0].toLowerCase()}</small>
            </div>
            </div>
            <FollowButton onClick={followUser} userID = {user.id}></FollowButton>
        </div>
        ))}
    </div>
);