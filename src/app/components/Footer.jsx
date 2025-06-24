// app/components/Footer.jsx
"use client";

import React from 'react';
import { FaWhatsapp, FaEnvelope} from 'react-icons/fa'; // Impor ikon yang diperlukan

export default function Footer() {
  // Ganti nomor WhatsApp ini dengan nomor yang Anda inginkan
  const whatsappNumber = "6287834968097"; // Format internasional tanpa '+'

  // URL WhatsApp untuk ikon logo di bagian bawah kanan
  // Menggunakan nomor CS untuk tautan ini
  const whatsappLogoLink = `https://wa.me/${whatsappNumber}`;

  return (
    // Mengurangi padding vertikal (py-8) dan margin atas (mt-8) untuk tampilan lebih compact di PC
    <footer className="bg-orange-100 text-gray-800 py-8 px-6 md:px-20 mt-8 rounded-t-xl shadow-inner">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6"> {/* Mengurangi gap untuk kerapatan */}
        {/* Bagian Lokasi */}
        <div>
          <h3 className="text-lg font-bold text-orange-700 mb-3">Lokasi</h3> {/* Mengurangi ukuran font h3 dan margin bawah */}
          <ul className="space-y-1 text-sm"> {/* Mengurangi spasi antar item list */}
            <li>
              <p className="font-semibold">Senopati, Jakarta Selatan</p>
              <p>Jl. Birah II, Pujasera Lapangan Blok S</p>
              <p>Senin-Minggu: 06.00-18.00</p>
            </li>
          </ul>
        </div>

        {/* Bagian Hubungi Kami */}
        <div>
          <h3 className="text-lg font-bold text-orange-700 mb-3">Hubungi Kami</h3> {/* Mengurangi ukuran font h3 dan margin bawah */}
          <ul className="space-y-1 text-sm"> {/* Mengurangi spasi antar item list */}
            <li>
              <a 
                href="mailto:belawanbloks@gmail.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center hover:text-orange-600 transition-colors"
              >
                <FaEnvelope className="mr-2 text-green-500" /> belawanbloks@gmail.com (Sales)
              </a>
            </li>
            <li>
              <a 
                href={`https://wa.me/${whatsappNumber}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center hover:text-orange-600 transition-colors"
              >
                <FaWhatsapp className="mr-2 text-green-500" /> 0877-3496-8097
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Gambar Footer Bawah */}blok
      {/* Gambar untuk redirect ke WhatsApp */}
      <div className="mt-6 flex flex-col md:flex-row justify-between items-center text-center md:text-left"> {/* Mengurangi margin atas */}
        <div className="flex-grow text-right hidden md:block">
            {/* Ruang untuk elemen lain jika diperlukan */}
        </div>
        <a 
          href={whatsappLogoLink} 
          target="_blank" 
          rel="noopener noreferrer" 
          aria-label="Hubungi kami via WhatsApp"
          className="ml-auto" // Memastikan gambar tetap di kanan bawah
        >
          <img src="https://res.cloudinary.com/dvdtihn0p/image/upload/v1749653908/belawan-food-app-menu/a5hm8lq9uprugvi3ph7s.webp" alt="Belawan" className="w-auto h-20 md:h-24 object-contain" loading="lazy" /> {/* Mengurangi tinggi gambar */}
        </a>
      </div>
      <p className="text-center text-xs text-gray-600 mt-6">&copy; {new Date().getFullYear()} Belawan Food App. All rights reserved.</p> {/* Mengurangi ukuran font dan margin atas */}
    </footer>
  );
}
