import { v2 as cloudinary } from 'cloudinary';
import { IncomingForm } from 'formidable';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: false, // Disable Next.js's body parser for formidable
  },
};

export const parseMultipartForm = (req) => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) return reject(err);

      let coverUrl = '';
      let pdfFileUrl = '';

      try {
        if (files.cover && files.cover.length > 0) {
          const coverFile = files.cover[0];
          const coverResult = await cloudinary.uploader.upload(coverFile.filepath, { resource_type: 'image' });
          coverUrl = coverResult.secure_url;
        }

        if (files.pdfFile && files.pdfFile.length > 0) {
          const pdfFile = files.pdfFile[0];
          const pdfResult = await cloudinary.uploader.upload(pdfFile.filepath, { resource_type: 'raw' });
          pdfFileUrl = pdfResult.secure_url;
        }

        resolve({ fields, coverUrl, pdfFileUrl });
      } catch (uploadError) {
        reject(uploadError);
      }
    });
  });
};
