import { useEffect, useState } from "react";
import { getUrl } from "aws-amplify/storage";


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