import axios from 'axios';

// Uploads one file, returns its Cloudinary URL
export const uploadImage = async (file, folder = 'products') => {
  const formData = new FormData();
  formData.append('image', file);

  const { data } = await axios.post(`/api/upload?folder=${folder}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.image;
};

// Uploads several at once. The server handles them in parallel, so this is
// much faster than looping one request per file.
export const uploadImages = async (files, folder = 'products') => {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));

  const { data } = await axios.post(
    `/api/upload/multiple?folder=${folder}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  return data.images.map((i) => i.image);
};

// Cloudinary resizes by URL, so a card can request a 400px version of an
// 1600px original. f_auto serves WebP where supported.
export const thumb = (url, width = 400) => {
  if (!url?.includes('res.cloudinary.com')) return url;

  return url.replace('/upload/', `/upload/w_${width},f_auto,q_auto/`);
};