import { useEffect, useState } from "react";
import { getUrl } from "aws-amplify/storage";


export function AvatarImage({ imagePath }: { imagePath: string }) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    const fetchUrl = async () => {
        console.log(`Getting URL for: ${imagePath}`)
        try {
            const link = await getUrl({ path: ("sdf") })
            console.log(link.url)
            setSrc(link.url.toString());
            
        } catch (err) {
            console.error("Error signing URL", err);
        }
    };

    fetchUrl();
  }, [imagePath]);

  return <img src={src} alt="User Avatar" style={{ width: 500, height: 500, borderRadius: '50%' }} />;
}