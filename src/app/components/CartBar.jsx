"use client"; // Penting untuk komponen klien di Next.js App Router

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useAnimationControls } from "framer-motion";

// Komponen CartBar
export default function CartBar({ cart, cartIconRef, pulseTrigger }) {
  const router = useRouter();
  const controls = useAnimationControls();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  // Pastikan ini menghitung total harga dengan benar, mempertimbangkan 'price' atau 'selectedSizePrice'
  const totalPrice = cart.reduce((sum, item) => sum + (item.price || item.selectedSizePrice || 0) * item.quantity, 0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Varian animasi pulse sederhana untuk efek visual
  const pulseVariants = {
    initial: { scale: 1 },
    pulsing: {
      scale: [1, 1.03, 1], // Animasi pulse yang lebih halus untuk bar
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  useEffect(() => {
    // Pemicu animasi hanya jika komponen sudah mounted dan ada item di keranjang
    if (mounted && totalItems > 0) {
      controls.start("pulsing");
    }
  }, [pulseTrigger, totalItems, controls, mounted]);

  // Jangan render apa-apa jika belum mounted atau keranjang kosong
  if (!mounted || totalItems === 0) {
    return null;
  }

  return (
    // Outer container untuk padding dari tepi layar
    <div
      className="
        fixed bottom-0 left-0 right-0 // Posisi di bagian paling bawah dan penuh lebar
        p-4 sm:p-6 // Padding responsif (padding lebih besar di breakpoint sm)
        z-40 // Pastikan di atas elemen lain
        md:hidden // Sembunyikan seluruh bar di layar tablet (md) ke atas
        flex justify-center items-end // Untuk memposisikan inner bar di tengah secara horizontal
      "
    >
      {/* Inner motion.div yang merupakan bar keranjang hijau itu sendiri */}
      <motion.div
        ref={cartIconRef} // Ref ini tetap digunakan untuk animasi item terbang
        onClick={() => router.push("/cart")}
        className="
          w-full max-w-lg // Mengambil lebar penuh dari parent, tapi ada batas max-width agar tidak terlalu lebar di tablet kecil
          bg-orange-500 text-white hover:bg-orange-600 // Warna latar belakang dan teks
          p-3 sm:p-4 // Padding internal untuk konten di dalam bar
          rounded-lg // Sudut membulat untuk tampilan yang bersih
          shadow-lg // Bayangan untuk menonjol
          cursor-pointer
          flex items-center justify-between // Konten sejajar dan terbagi rata
          transform transition-transform duration-300 ease-out // Animasi transisi
        "
        variants={pulseVariants}
        animate={controls}
      >
        {/* Container untuk Ikon Keranjang dan Jumlah Item */}
        <div className="flex items-center space-x-3"> {/* Tambah sedikit space */}
          {/* Ikon Keranjang (dari heroicons) */}
          <svg
            className="w-6 h-6 text-white" // Pastikan ikon berwarna putih
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          {/* Tampilkan jumlah item hanya jika ada item */}
          {totalItems > 0 && (
            <span className="
              text-sm font-semibold
              px-2.5 py-1.5 // Padding sedikit lebih besar
            text-white  // Latar belakang putih, teks hijau lebih gelap untuk kontras
              rounded-full
              min-w-[32px] text-center // Pastikan lebar minimum untuk angka
            ">
              {totalItems} Items
            </span>
          )}
        </div>

        {/* Tampilkan Total Harga */}
        {totalItems > 0 && (
          <span className="text-lg font-bold">
            Rp{totalPrice.toLocaleString('id-ID')}
          </span>
        )}
      </motion.div>
    </div>
  );
}
