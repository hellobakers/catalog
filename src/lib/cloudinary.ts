export async function uploadToCloudinary(file: File) {
  console.log("Cloudinary upload placeholder:", file.name);
  return URL.createObjectURL(file);
}

export async function deleteFromCloudinary(publicId: string) {
  console.log("Cloudinary delete placeholder:", publicId);
  return true;
}

export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  uploadPreset: "product_images",
  maxFileSize: 5 * 1024 * 1024,
  allowedFormats: ["jpg", "jpeg", "png", "webp"],
};
