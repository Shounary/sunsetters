import { RekognitionClient, DetectLabelsCommand } from "@aws-sdk/client-rekognition";
import type { Schema } from "../../data/resource";

// Initialize the client
const rekognition = new RekognitionClient();

export const handler: Schema["sunsetAnalyzer"]["functionHandler"] = async (event) => {
  const { imagePath } = event.arguments;
  const bucketName = process.env.BUCKET_NAME;

  if (!bucketName) throw new Error("BUCKET_NAME environment variable is missing");

  // Build the request for Rekognition
  const command = new DetectLabelsCommand({
    Image: {
      S3Object: {
        Bucket: bucketName,
        Name: imagePath,
      },
    },
    MaxLabels: 10,       
    MinConfidence: 75,
  });

  try {
    const response = await rekognition.send(command);
    const labels = response.Labels || [];

    console.log("Rekognition found:", labels.map(l => l.Name).join(", "));

    // Check if the AI detected target words
    const isSunset = labels.some(label => 
      label.Name === 'Sunset' || 
      label.Name === 'Sunrise' || 
      label.Name === 'Dusk'
    );

    return isSunset;
    
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Failed to analyze image");
  }
};