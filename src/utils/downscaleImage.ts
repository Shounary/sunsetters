/**
 * Downscales an image to fit within max dimensions while maintaining aspect ratio.
 */
export function downscaleImage(
  file: File, 
  maxWidth: number = 1200, 
  maxHeight: number = 1200, 
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img: HTMLImageElement = new Image();
    const objectUrl: string = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl); 

      let width: number = img.width;
      let height: number = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas: HTMLCanvasElement = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get 2D canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob: Blob | null) => {
        if (!blob) {
          reject(new Error('Canvas to Blob conversion failed'));
          return;
        }
        
        const resizedFile: File = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now()
        });
        
        resolve(resizedFile);
      }, file.type, quality);
    };

    img.onerror = () => reject(new Error('Failed to load image for resizing'));
    img.src = objectUrl;
  });
}