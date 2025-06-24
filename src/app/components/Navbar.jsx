// components/Navbar.jsx
"use client";

import React, { useContext, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CartContext } from './CartContext';
import { usePathname } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa'; // Import ikon user

export default function Navbar({ onHeightChange, isAdminPage }) { // Menerima prop isAdminPage
  // Ambil toggleProfileSidebar dari CartContext
  const { cart, auth, user, isAuthReady, toggleProfileSidebar, getTotalItems } = useContext(CartContext); 
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.selectedSizePrice || item.price || 0) * item.quantity, 0);

  const navbarRef = useRef(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const [navbarActualHeight, setNavbarActualHeight] = useState(0);

  const pathname = usePathname();

  useEffect(() => {
    let timeoutId;

    const measureHeight = () => {
      if (navbarRef.current) {
        const height = navbarRef.current.offsetHeight;
        setNavbarActualHeight(height);
        if (onHeightChange) {
          onHeightChange(height);
        }
      }
    };

    if (typeof window !== 'undefined') {
      measureHeight();
      timeoutId = setTimeout(measureHeight, 100); 
      window.addEventListener('resize', measureHeight);
    }
    return () => {
      if (typeof window !== 'undefined') {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', measureHeight);
      }
    };
  }, [onHeightChange]);


  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsAtTop(currentScrollY < 10);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll);
      handleScroll(); // Set initial state
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const isCartPage = pathname === '/cart';
  const isOrderSuccessPage = pathname === '/order-success'; 
  const isLoginPage = pathname === '/login';

  // Tentukan warna teks untuk ikon keranjang/lain-lain berdasarkan kondisi
  let cartIconTextColorClass;
  if (isCartPage) {
    cartIconTextColorClass = 'text-gray-950'; // Selalu hitam di halaman cart
  } else {
    cartIconTextColorClass = isAtTop ? 'text-white' : 'text-gray-950'; // Transparan/putih di menu hero, hitam saat scroll
  }

  // Tentukan warna teks untuk ikon daftar/list
  let listIconTextColorClass;
  if (isCartPage) {
    listIconTextColorClass = 'text-gray-950'; // Selalu hitam di halaman cart
  } else {
    listIconTextColorClass = isAtTop ? 'text-white' : 'text-gray-950'; // Transparan/putih di menu hero, hitam saat scroll
  }

  // Tentukan warna teks untuk ikon profil
  let profileIconTextColorClass;
  // Di halaman keranjang atau order-success, selalu hitam
  // Di halaman menu (saat isAtTop=false), juga hitam
  // Transparan hanya di halaman menu saat isAtTop=true
  if (isCartPage || isOrderSuccessPage || (pathname === '/menu' && !isAtTop)) {
    profileIconTextColorClass = 'text-gray-950';
  } else { 
    profileIconTextColorClass = 'text-white'; // Default putih (saat di menu hero transparan)
  }
  
  const listIconSvg = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 7.5h.007v.008H3.75V14.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 7.5h.007v.008H3.75V21.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );

  // Jika di halaman login atau admin, return null agar navbar tidak dirender
  if (isLoginPage || isAdminPage) {
    return null;
  }

  return (
    <motion.nav
      ref={navbarRef}
      initial={{ y: 0 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`
        py-4 px-6 md:px-20 flex justify-between items-center fixed w-full z-50 top-0
        transition-all duration-300 ease-in-out
        ${isAtTop && !isCartPage && !isOrderSuccessPage 
          ? 'bg-transparent shadow-none'
          : 'bg-white shadow-md'
        }
      `}
    >
      {/* Logo / Nama Aplikasi (Kiri) */}
      <div className="flex items-center">
        {isAdminPage ? ( // Tidak lagi diperlukan karena navbar admin sudah return null
          <span className="flex-shrink-0 text-2xl font-bold text-orange-400">
            Admin Panel
          </span>
        ) : (
          <Link href="/" className="text-xl md:text-2xl font-bold text-orange-600">
             <img src="/images/belawan-logo.png" alt="logo-belawan" className="block md:hidden w-auto h-8"/>
             <img src="/images/belawan-logo-pc.png" alt="logo-belawan" className="hidden md:block w-auto h-10"/>
          </Link>
        )}
      </div>

      <div className="flex items-center space-x-4 md:space-x-6">
        {/* Sembunyikan keranjang jika di halaman order-success ATAU admin */}
        {!isOrderSuccessPage && !isAdminPage && ( 
          <div className="hidden md:block">
            {totalItems === 0 ? (
              <Link
                href="/cart"
                className={`
                  relative
                  ${cartIconTextColorClass} 
                  hover:text-orange-600
                  transition-colors duration-200
                  p-2
                  rounded-full
                  flex items-center justify-center
                  w-10 h-10
                `}
              >
                <svg
                  className="w-6 h-6"
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
              </Link>
            ) : (
              <Link
                href="/cart"
                className="
                  relative
                  bg-orange-500
                  text-white
                  px-4 py-2
                  rounded-lg
                  shadow-md
                  hover:bg-orange-600
                  transition-colors duration-200
                  flex items-center space-x-2
                  min-w-[120px] justify-center
                "
              >
                <svg
                  className="w-6 h-6"
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
                <span className="text-lg font-bold">
                  Rp{totalPrice.toLocaleString('id-ID')}
                </span>
                <span
                  className="
                    absolute
                    -top-2 -left-2
                    bg-white
                    text-orange-500
                    text-xs font-bold
                    rounded-full
                    w-6 h-6
                    flex items-center justify-center
                    border-2 border-orange-500
                  "
                >
                  {totalItems}
                </span>
              </Link>
            )}
          </div>
        )}
        
        {/* Sembunyikan ikon daftar/list jika di halaman order-success ATAU admin */}
        {!isOrderSuccessPage && !isAdminPage && (
          <Link href="/order-success" className={`font-medium ${listIconTextColorClass}`}>
            {listIconSvg}
          </Link>
        )}

        {/* Sembunyikan ikon Profil jika di halaman order-success ATAU admin */}
        {!isOrderSuccessPage && !isAdminPage && (
          <button // Ubah dari Link ke button
            onClick={toggleProfileSidebar} // Memanggil fungsi toggle sidebar
            className={`
              flex items-center space-x-2 
              font-medium 
              ${profileIconTextColorClass}
              hover:text-orange-600 
              transition-colors duration-200
              text-lg md:text-md
              p-2 rounded-full
            `}
            aria-label="Profil"
          >
            <FaUserCircle className="w-7 h-7" />
            {isAuthReady && user ? (
              <span className="hidden sm:inline">
                {user.displayName || user.email || (user.isAnonymous ? "Guest" : user.phoneNumber) || "Pengguna"}
              </span>
            ) : (
              <span className="hidden sm:inline">Memuat...</span>
            )}
          </button>
        )}
      </div>
    </motion.nav>
  );
}
