// src/app/api/upload-image/route.js

import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

// Konfigurasi Cloudinary menggunakan environment variables
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, // Ini aman karena ini adalah nama cloud, bukan rahasia
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Direkomendasikan untuk menggunakan HTTPS
});

/**
 * Handle POST request untuk mengunggah gambar ke Cloudinary.
 * Menerima file gambar sebagai FormData.
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file'); // 'file' adalah nama field dari FormData

    if (!file) {
      return NextResponse.json({ success: false, message: 'Tidak ada file yang diunggah.' }, { status: 400 });
    }

    // Ubah File menjadi ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    // Ubah ArrayBuffer menjadi Buffer Node.js
    const buffer = Buffer.from(arrayBuffer);

    // Kirim gambar ke Cloudinary
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        folder: 'belawan-food-app-menu',
        resource_type: 'image',
      }, (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          resolve(NextResponse.json({ success: false, message: 'Gagal mengunggah gambar ke Cloudinary.', error: error.message }, { status: 500 }));
        } else {
          console.log('Cloudinary upload success:', result.secure_url);
          resolve(NextResponse.json({ success: true, url: result.secure_url, public_id: result.public_id }, { status: 200 }));
        }
      }).end(buffer);
    });

  } catch (error) {
    console.error('Error in POST /api/upload-image:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.', error: error.message }, { status: 500 });
  }
}
