// src/components/MessageBox.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Digunakan untuk animasi modal

/**
 * Komponen MessageBox untuk menampilkan pesan kustom dalam bentuk modal.
 *
 * @param {object} props - Properti komponen.
 * @param {string} props.title - Judul pesan yang akan ditampilkan.
 * @param {string} props.content - Isi atau deskripsi pesan.
 * @param {string} [props.type='info'] - Tipe pesan ('info', 'success', 'error'). Mengubah warna latar belakang judul.
 * @param {function} props.onClose - Fungsi yang dipanggil saat tombol "Oke" diklik atau modal ditutup.
 */
export default function MessageBox({ title, content, type = 'info', onClose }) {
  // Menentukan warna latar belakang dan teks berdasarkan tipe pesan
  let bgColor = 'bg-orange-500'; // Default untuk 'info'
  let textColor = 'text-white'; // Default untuk teks judul

  if (type === 'success') {
    bgColor = 'bg-green-500'; // Warna hijau untuk pesan sukses
  } else if (type === 'error') {
    bgColor = 'bg-red-500'; // Warna merah untuk pesan error
  }

  return (
    // AnimatePresence digunakan untuk menganimasikan keluar masuknya komponen
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} // Kondisi awal (tidak terlihat)
        animate={{ opacity: 1 }} // Animasi masuk (menjadi terlihat)
        exit={{ opacity: 0 }}    // Animasi keluar (kembali tidak terlihat)
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        // Overlay yang menutupi seluruh layar dengan latar belakang semi-transparan
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} // Kondisi awal modal (sedikit lebih kecil, tidak terlihat)
          animate={{ scale: 1, opacity: 1 }} // Animasi masuk modal (membesar ke ukuran normal, terlihat)
          exit={{ scale: 0.9, opacity: 0 }}    // Animasi keluar modal (mengecil, tidak terlihat)
          className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center"
          // Kontainer utama modal: latar belakang putih, sudut membulat, bayangan, lebar maksimum, rata tengah
        >
          {/* Judul pesan dengan warna latar belakang dinamis */}
          <h3 className={`text-xl font-semibold mb-4 ${textColor} ${bgColor} p-2 rounded-md`}>
            {title}
          </h3>
          {/* Isi pesan */}
          <p className="text-gray-700 mb-6">{content}</p>
          {/* Tombol untuk menutup modal */}
          <button
            onClick={onClose} // Panggil fungsi onClose saat tombol diklik
            className="px-5 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition"
            // Gaya tombol: padding, warna oranye, teks putih, sudut membulat, efek hover, transisi halus
          >
            Oke
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
