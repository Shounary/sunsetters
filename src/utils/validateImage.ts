

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates the image to of the right file type.
 */
export function isValidImage(file: File | undefined | null): ValidationResult {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }

  const allowedTypes: string[] = [
    'image/jpeg', 
    'image/png', 
    'image/webp', 
    'image/gif'
  ];

  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: "Invalid file format. Please upload a JPEG, PNG, WEBP, or GIF." 
    };
  }

  const maxSizeInBytes: number = 100 * 1024 * 1024; // 5MB
  if (file.size > maxSizeInBytes) {
    return { 
      valid: false, 
      error: "File is too large. Maximum size is 100mB." 
    };
  }

  return { valid: true };
}