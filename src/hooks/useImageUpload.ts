import { useState, useCallback, useEffect } from 'react';
import { isValidImage } from '../utils/validateImage';
import { downscaleImage } from '../utils/downscaleImage';

interface UseImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Hook that manages the file validation, downscaling process, and generates a preview URL.
 */
export function useImageUpload(options: UseImageUploadOptions = {}) {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = options;

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    
    // Reset previous states
    setError(null);
    setIsProcessing(true);

    if (!selectedFile) {
      setIsProcessing(false);
      return;
    }

    // Validates file
    const validation = isValidImage(selectedFile);
    if (!validation.valid) {
      setError(validation.error || 'Invalid image file.');
      setIsProcessing(false);
      // Reset the actual input value so the same file can be selected again if needed
      event.target.value = ''; 
      return;
    }

    try {
      // Downscales image
      const optimizedFile = await downscaleImage(selectedFile, maxWidth, maxHeight, quality);
      
      setFile(optimizedFile);
      
      // Creates a local preview URL
      const url = URL.createObjectURL(optimizedFile);
      setPreviewUrl(url);
      
    } catch (err) {
      console.error("Image processing error:", err);
      setError("Failed to process the image. Please try another file.");
    } finally {
      setIsProcessing(false);
    }
  }, [maxWidth, maxHeight, quality]);

  // Cleanups the object URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const clearImage = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
  }, []);

  return {
    file,
    previewUrl,
    isProcessing,
    error,
    handleImageChange,
    clearImage
  };
}