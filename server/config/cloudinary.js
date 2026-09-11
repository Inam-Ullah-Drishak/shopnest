import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Which folders an upload is allowed to target. A whitelist, so a client
// can't write into an arbitrary path in your account.
export const FOLDERS = {
  products: 'shopnest/products',
  categories: 'shopnest/categories',
  collections: 'shopnest/collections',
  avatars: 'shopnest/avatars',
  site: 'shopnest/site',
};

// Uploads a buffer. The SDK's upload_stream is callback-based, so wrap it.
export const uploadBuffer = (buffer, folder, publicId) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: false,
        unique_filename: true,
        // Never store anything larger than we could use
        transformation: [
          { width: 1600, height: 1600, crop: 'limit' },
          { quality: 'auto:good' },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });

export const deleteImage = (publicId) =>
  cloudinary.uploader.destroy(publicId, { resource_type: 'image' });

// Turns a Cloudinary URL back into its public_id, so we can delete it
export const publicIdFromUrl = (url) => {
  if (!url?.includes('res.cloudinary.com')) return null;

  // .../upload/v1234567890/shopnest/products/name.jpg
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
  return match ? match[1] : null;
};

export default cloudinary;