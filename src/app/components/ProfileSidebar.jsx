// components/ProfileSidebar.jsx
"use client";

import React, { useContext, useEffect } from 'react'; // Import useEffect
import { motion, AnimatePresence } from 'framer-motion';
import { CartContext } from './CartContext';
import Link from 'next/link';
import { getAuth, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { FaShoppingCart } from 'react-icons/fa'; // Import ikon keranjang

export default function ProfileSidebar({ isOpen, onClose }) {
  const { user, isAuthReady, auth, db, toggleProfileSidebar } = useContext(CartContext);
  const router = useRouter();

  // === START: Efek untuk mengunci/membuka scroll body ===
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Kunci scroll
      // Optionally, you might want to adjust for scrollbar width if it causes a shift
      // document.body.style.paddingRight = 'var(--scrollbar-width)'; 
    } else {
      document.body.style.overflow = ''; // Buka scroll
      // document.body.style.paddingRight = '';
    }

    // Cleanup function untuk mereset overflow saat komponen di-unmount atau isOpen berubah
    return () => {
      document.body.style.overflow = '';
      // document.body.style.paddingRight = '';
    };
  }, [isOpen]); // Bergantung pada status isOpen
  // === END: Efek untuk mengunci/membuka scroll body ===


  // MessageBox component (copy-pasted from LoginPage for consistency)
  const MessageBox = ({ title, content, type, onClose }) => {
    let bgColor = 'bg-orange-500';
    let textColor = 'text-white';
    if (type === 'success') {
      bgColor = 'bg-green-500';
    } else if (type === 'error') {
      bgColor = 'bg-red-500';
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]" // Z-index lebih tinggi dari sidebar
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center"
        >
          <h3 className={`text-xl font-semibold mb-4 ${textColor} ${bgColor} p-2 rounded-md`}>{title}</h3>
          <p className="text-gray-700 mb-6">{content}</p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition"
          >
            Oke
          </button>
        </motion.div>
      </motion.div>
    );
  };

  const [showMessageBox, setShowMessageBox] = React.useState(false);
  const [messageBoxTitle, setMessageBoxTitle] = React.useState('');
  const [messageBoxContent, setMessageBoxContent] = React.useState('');
  const [messageBoxType, setMessageBoxType] = React.useState('info');

  const showCustomMessageBox = (title, content, type = 'info') => {
    setMessageBoxTitle(title);
    setMessageBoxContent(content);
    setMessageBoxType(type);
    setShowMessageBox(true);
  };

  const hideCustomMessageBox = () => {
    setShowMessageBox(false);
  };

  const handleSignOut = async () => {
    if (!auth) {
      showCustomMessageBox("Error", "Layanan autentikasi tidak tersedia.", "error");
      return;
    }
    try {
      await signOut(auth);
      showCustomMessageBox("Logout Berhasil", "Anda telah berhasil logout.", "success");
      onClose(); // Tutup sidebar setelah logout
      router.replace('/login'); 
    } catch (error) {
      console.error("Error signing out:", error);
      showCustomMessageBox("Error Logout", `Gagal logout: ${error.message}`, "error");
    }
  };

  const handleLoginGoogle = async () => {
    if (!auth) {
      showCustomMessageBox("Error", "Layanan autentikasi tidak tersedia.", "error");
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      showCustomMessageBox("Login Berhasil", "Anda berhasil masuk dengan Google!", "success");
      onClose(); 
    } catch (error) {
      console.error("Error upgrading anonymous to Google:", error);
      showCustomMessageBox("Error Login", `Gagal login dengan Google: ${error.message}`, "error");
    }
  };

  const handleFoodOnCartClick = () => {
    onClose(); // Tutup sidebar
    router.push('/cart'); // Arahkan ke halaman keranjang
  };

  return (
    <>
      {/* Sidebar AnimatePresence */}
      <AnimatePresence key="sidebar">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end" // Overlay latar belakang
            onClick={onClose} // Menutup sidebar saat klik di luar
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: '0%' }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="w-2/3 sm:w-2/3 md:w-1/2 lg:w-2/5 xl:w-1/3 bg-white h-full shadow-lg relative p-6 sm:p-8 overflow-y-auto" // Konten sidebar
              onClick={(e) => e.stopPropagation()} // Mencegah penutupan saat klik di dalam sidebar
            >
              {/* Tombol Close (X) */}
              <button
                onClick={onClose}
                className="absolute top-4 left-2 p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-full hover:bg-gray-100"
                aria-label="Tutup sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center mt-6">Profil Saya</h2>

              {/* Konten berdasarkan status login */}
              {!isAuthReady ? (
                <div className="text-center py-10">
                  <svg className="animate-spin h-10 w-10 text-orange-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-700 text-lg">Memuat informasi profil...</p>
                </div>
              ) : user && !user.isAnonymous ? (
                // Jika pengguna sudah login (non-anonim)
                <div className="space-y-4">
                  <p className="text-gray-700 text-base sm:text-lg break-words">
                    <span className="font-semibold">ID Pengguna:</span> {user.uid}
                  </p>
                  {user.displayName && (
                    <p className="text-gray-700 text-base sm:text-lg break-words">
                      <span className="font-semibold">Nama:</span> {user.displayName}
                    </p>
                  )}
                  {user.email && (
                    <p className="text-gray-700 text-base sm:text-lg break-words">
                      <span className="font-semibold">Email:</span> {user.email}
                    </p>
                  )}
                  {user.phoneNumber && (
                    <p className="text-gray-700 text-base sm:text-lg break-words">
                      <span className="font-semibold">Telepon:</span> {user.phoneNumber}
                    </p>
                  )}
                  
                  {/* Tombol Food on Cart (untuk pengguna terautentikasi) */}
                  <button
                    onClick={handleFoodOnCartClick}
                    className="w-full mt-6 py-3 px-4 rounded-lg font-semibold md:hidden bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-50 transition shadow-md text-base sm:text-lg flex items-center justify-center space-x-2"
                  >
                    <FaShoppingCart className="w-5 h-5" />
                    <span>Food on Cart</span>
                  </button>

                  {/* Tombol Logout */}
                  <button
                    onClick={handleSignOut}
                    className="w-full mt-4 py-3 px-4 rounded-lg font-semibold bg-red-500 text-white hover:bg-red-600 transition shadow-md text-base sm:text-lg"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                // Jika pengguna anonim
                <div className="text-center space-y-6">
                  <p className="text-gray-600 text-md sm:text-xl">Anda saat ini masuk sebagai pengguna anonim.</p>
                  <p className="text-gray-600 text-md sm:text-md">
                    Untuk melihat dan menyimpan riwayat pesanan Anda, serta mengakses fitur akun penuh, silakan login atau daftar.
                  </p>
                  <Link href="/login?mode=forceLogin" onClick={onClose} className="block w-full py-3 px-4 rounded-lg font-semibold bg-orange-500 text-white hover:bg-orange-600 transition shadow-md text-md sm:text-lg">
                    Login / Daftar
                  </Link>
                  <button
                    onClick={handleLoginGoogle}
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 transition font-medium mt-4 text-md sm:text-lg"
                  >
                    <img src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png" alt="Google" className="w-5 h-5 mr-3" />
                    Login Google
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MessageBox AnimatePresence */}
      <AnimatePresence key="messagebox">
        {showMessageBox && (
          <MessageBox
            title={messageBoxTitle}
            content={messageBoxContent}
            type={messageBoxType}
            onClose={hideCustomMessageBox}
          />
        )}
      </AnimatePresence>
    </>
  );
}