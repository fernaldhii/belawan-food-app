// next.config.mjs (atau next.config.js jika Anda mengubah namanya)
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/apps-script', // Path yang akan Anda panggil dari frontend
        destination: 'https://script.google.com/macros/s/AKfycbynSw5l4D68MyuTZOI32HOtaXa7fLVDVG2Q3TY9qcR3m-R-D69XeRastfnlRkGujWYgsg/exec', // URL Apps Script Anda
      },
    ];
  },
};

export default nextConfig; // Perubahan di sini: dari module.exports menjadi export default