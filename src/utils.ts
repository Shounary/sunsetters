export function isValidImage(file: File | null) {
  // 1. Check if a file actually exists
  if (!file) {
    return { valid: true };
  }

  // 2. Define the exact MIME types you want to allow
  const allowedTypes = [
    'image/jpeg', 
    'image/png', 
    'image/webp', 
    'image/gif'
  ];

  // 3. Check the file type
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: "Invalid file format. Please upload a JPEG, PNG, WEBP, or GIF." 
    };
  }

  const maxSizeInBytes = 20 * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return { 
      valid: false, 
      error: "File is too large. Maximum size is 5MB." 
    };
  }

  return { valid: true };
}