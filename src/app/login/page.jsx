// app/login/page.jsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Import Firebase Auth untuk signInAnonymously dan Google
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- KONFIGURASI FIREBASE ---
// Kita akan menggunakan konfigurasi ini secara lokal dalam komponen
const firebaseConfig = typeof window !== 'undefined' && typeof __firebase_config !== 'undefined'
  ? JSON.parse(__firebase_config)
  : {
      apiKey: "AIzaSyDp3-v-HU02vsUfPHpmNdetpUUB_DPyOK0",
      authDomain: "umkm-belawan.firebaseapp.com",
      projectId: "umkm-belawan",
      storageBucket: "umkm-belawan.firebasestorage.app",
      messagingSenderId: "952896654123",
      appId: "1:952896654123:web:fcc246252e2e47e72c936e",
    };

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [messageBoxTitle, setMessageBoxTitle] = useState('');
  const [messageBoxContent, setMessageBoxContent] = useState('');
  const [messageBoxType, setMessageBoxType] = useState('info');

  // States untuk instance Firebase yang dikelola secara lokal
  const [appInstance, setAppInstance] = useState(null);
  const [authInstance, setAuthInstance] = useState(null);
  const [dbInstance, setDbInstance] = useState(null);
  const [firebaseInitError, setFirebaseInitError] = useState(null);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false); // Overall Firebase ready state

  // === START: State untuk mengontrol pengalihan setelah pesan ditutup ===
  const [shouldRedirectAfterDismiss, setShouldRedirectAfterDismiss] = useState(false);
  // === END: State baru ===

  const isForceLoginMode = searchParams.get('mode') === 'forceLogin';
  console.log("LoginPage: isForceLoginMode detected as", isForceLoginMode);

  // useEffect untuk inisialisasi Firebase App, Auth, dan Firestore
  useEffect(() => {
    console.log("[LoginPage Init] Attempting to initialize Firebase locally...");
    if (!firebaseConfig || !firebaseConfig.apiKey || !firebaseConfig.projectId) {
      const error = new Error("Firebase configuration is incomplete or not found.");
      console.error("[LoginPage Init] Firebase Config Error -", error.message);
      setFirebaseInitError(error);
      setIsFirebaseReady(true); // Tandai siap walau error agar UI tidak stuck
      return;
    }

    try {
      let app;
      const existingApps = getApps();
      if (existingApps && existingApps.length > 0) {
        app = getApp('[DEFAULT]');
        console.log("[LoginPage Init] Firebase App '[DEFAULT]' already exists. Reusing.");
      } else {
        app = initializeApp(firebaseConfig);
        console.log("[LoginPage Init] New Firebase App '[DEFAULT]' initialized.");
      }
      setAppInstance(app);

      const auth = getAuth(app);
      setAuthInstance(auth);
      console.log("[LoginPage Init] Firebase Auth instance retrieved successfully.");

      const db = getFirestore(app);
      setDbInstance(db);
      console.log("[LoginPage Init] Firebase Firestore instance retrieved successfully.");

      setIsFirebaseReady(true); // Semua instance sudah diatur
      console.log("[LoginPage Init] Firebase is fully ready!");

    } catch (error) {
      console.error("[LoginPage Init] Failed to initialize Firebase instances locally:", error);
      setFirebaseInitError(error);
      setIsFirebaseReady(true); // Tandai siap walau error agar UI tidak stuck
    }
  }, []); // Hanya dijalankan sekali saat komponen di-mount

  // useEffect untuk onAuthStateChanged (tergantung pada authInstance)
  useEffect(() => {
    if (firebaseInitError) {
      console.error("[LoginPage Auth Listener] Firebase global init error detected. Skipping Auth listener.");
      setIsLoading(false);
      return;
    }
    if (!authInstance) { // Pastikan authInstance sudah ada
      console.log("[LoginPage Auth Listener] Firebase Auth instance not available yet. Skipping Auth listener setup.");
      return;
    }

    console.log("[LoginPage Auth Listener] Subscribing to onAuthStateChanged.");
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      console.log("LoginPage: onAuthStateChanged fired. User:", user ? user.uid : "None", "Anonymous:", user?.isAnonymous);
      setIsLoading(false);
    });

    return () => {
      console.log("LoginPage: useEffect cleanup. Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    };
  }, [authInstance, firebaseInitError]); // Bergantung pada authInstance dan firebaseInitError

  const showCustomMessageBox = (title, content, type = 'info') => {
    setMessageBoxTitle(title);
    setMessageBoxContent(content);
    setMessageBoxType(type);
    setShowMessageBox(true);
  };

  // === START: Modifikasi fungsi hideCustomMessageBox ===
  const hideCustomMessageBox = () => {
    setShowMessageBox(false);
    if (shouldRedirectAfterDismiss) {
      console.log("Redirecting to /menu after message box dismissal.");
      router.replace('/menu');
      setShouldRedirectAfterDismiss(false); // Reset flag
    }
  };
  // === END: Modifikasi fungsi ===

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    if (!authInstance) { // Gunakan authInstance
      showCustomMessageBox("Error", "Layanan autentikasi tidak tersedia.", "error");
      setIsLoading(false);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(authInstance, provider); // Gunakan authInstance
      showCustomMessageBox("Login Berhasil", "Anda berhasil masuk dengan Google!", "success");
      console.log("Google login successful.");
      
      // === START: Tambahan untuk redirect setelah Google Login ===
      // Set flag untuk redirect setelah message box ditutup
      setShouldRedirectAfterDismiss(true); 
      // === END: Tambahan untuk redirect ===

    } catch (error) {
      console.error("Error signing in with Google:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        showCustomMessageBox("Login Dibatalkan", "Anda menutup jendela login Google.", "info");
      } else if (error.code === 'auth/cancelled-popup-request') {
        showCustomMessageBox("Permintaan Dibatalkan", "Terjadi masalah dengan permintaan popup. Mohon coba lagi.", "error");
      } else if (error.code === 'auth/network-request-failed') {
          showCustomMessageBox("Kesalahan Jaringan", "Gagal masuk dengan Google. Pastikan koneksi internet Anda stabil. Error: " + error.message, "error");
      } else if (error.code === 'auth/unauthorized-domain') {
          showCustomMessageBox("Domain Tidak Diizinkan", "Permintaan login berasal dari domain yang tidak diizinkan. Mohon periksa pengaturan Authorized Domains di Firebase Console Anda.", "error");
      }
      else {
        showCustomMessageBox("Error", `Gagal masuk dengan Google: ${error.message}.`, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipLogin = async () => {
    if (isForceLoginMode) {
      console.warn("Attempted to skip login in forceLoginMode. Action blocked.");
      return;
    }

    setIsLoading(true);
    console.log("LoginPage: Attempting to sign in anonymously. isLoading set to TRUE.");

    if (!authInstance) { // Gunakan authInstance
      console.error("LoginPage: Firebase Auth instance not available. Cannot sign in anonymously.");
      showCustomMessageBox("Gagal Lewati", "Layanan autentikasi tidak tersedia. Silakan coba lagi nanti.", "error");
      setIsLoading(false);
      return;
    }

    try {
      console.log("LoginPage: Calling signInAnonymously...");
      await signInAnonymously(authInstance); // Gunakan authInstance
      console.log("LoginPage: signInAnonymously successful. RootLayout will handle redirection to /menu based on auth state.");
    } catch (error) {
      console.error("LoginPage: Error signing in anonymously:", error);
      showCustomMessageBox("Gagal Lewati", `Terjadi kesalahan: ${error.message}.`, "error");
    } finally {
      setIsLoading(false); 
      console.log("LoginPage: isLoading set to FALSE in handleSkipLogin finally block.");
    }
  };

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
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
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

  console.log("LoginPage Render Cycle: isLoading =", isLoading, "isForceLoginMode =", isForceLoginMode, "isFirebaseReady =", isFirebaseReady); 

  // Tampilkan loading screen jika Firebase belum siap
  if (!isFirebaseReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-orange-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-700 text-lg">Memuat layanan login...</p>
          {firebaseInitError && (
              <p className="text-red-500 text-sm mt-2">Error: {firebaseInitError.message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 p-4 sm:p-6 md:p-8">
      {/* Logo Aplikasi di pojok kiri atas (Hanya jika TIDAK forceLoginMode) */}
      {!isForceLoginMode && (
        <div 
          className="absolute top-14 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
        >
          <img src="/images/logo.png" alt="logo" className="block md:hidden w-auto h-8 mt-40"/>
          <img src="/images/logo-pc.png" alt="logo" className="hidden md:block mt-20"/>
        </div>
      )}

      {/* Kontainer Utama untuk mode forceLogin (PC: Flexbox) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        // Kelas untuk kontainer utama: responsif
        className={`w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 
                    ${isForceLoginMode ? 'md:max-w-screen-lg md:flex md:h-[600px] lg:h-[650px] xl:h-[700px]' : ''}`} // Lebar maks & tinggi yang disesuaikan
      >
        {/* Bagian Kiri: Gambar (HANYA UNTUK PC forceLoginMode) */}
        {isForceLoginMode && (
          <div className="hidden md:block md:w-1/2 rounded-l-2xl opacity-50 overflow-hidden relative">
            <img 
              src="https://img.freepik.com/premium-vector/sketch-hand-drawn-contoured-seafood-elements_80590-2529.jpg" // Ganti dengan URL gambar Anda
              alt="Delicious Food"
              className="w-full h-full object-cover" 
            />
          </div>
        )}

        {/* Bagian Kanan: Form Login / Daftar */}
        <div className={`w-full p-6 sm:p-8 relative ${isForceLoginMode ? 'md:w-1/2' : ''}`}>
          {/* Tombol Close (X) di pojok kiri atas CARD - HANYA JIKA forceLoginMode */}
          {isForceLoginMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-4 left-4 z-10" // Posisi relatif terhadap kontainer form
            >
              <button
                onClick={() => router.replace('/menu')} // Redirect ke halaman utama
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-full hover:bg-gray-100"
                aria-label="Tutup"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}

          <h2 className="text-xl font-bold text-gray-800 mb-2 mt-8 text-center">Login / Daftar</h2>
          <p className="text-gray-600 mb-6 text-center text-sm">
            Pilih metode login yang Anda inginkan
          </p>

          {/* Tombol Login Sosial */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 transition font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-gray-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <img src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png" alt="Google" className="w-5 h-5 mr-3" />
              )}
              Masuk dengan Google
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            Dengan melanjutkan, Anda menyetujui
            <Link href="/terms" className="text-orange-500 hover:underline ml-1">Syarat & Ketentuan</Link> dan
            <Link href="/privacy" className="text-orange-500 hover:underline ml-1">Kebijakan Privasi</Link>.
          </p>

          {/* Tombol Lewati / Skip - HANYA JIKA TIDAK forceLoginMode */}
          {!isForceLoginMode && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">atau</span>
                </div>
              </div>
              
              <button
                onClick={handleSkipLogin}
                className={`w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm font-medium transition ${
                    isLoading ? 'text-gray-400 cursor-not-allowed bg-gray-100' : 'text-orange-500 hover:bg-orange-50'
                  }`}
                disabled={isLoading}
              >
                Lansung Langsung Pesan
              </button>
            </>
          )}
        </div> {/* Penutup div untuk Bagian Kanan: Form Login / Daftar */}
      </motion.div> {/* Penutup motion.div untuk Kontainer Utama */}

      {/* Footer dengan tautan */}
      <footer className="mt-8 text-center text-gray-500 text-xs px-4">
        <p>&copy; 2025 Belawan Food Inc.
          <Link href="#" className="text-orange-600 hover:underline ml-1">Syarat dan Ketentuan</Link>
          <Link href="#" className="text-orange-600 hover:underline ml-1">Kebijakan Privasi</Link>
          <Link href="#" className="text-orange-600 hover:underline ml-1">Ketentuan Penggunaan</Link>
        </p>
      </footer>

      <AnimatePresence>
        {showMessageBox && (
          <MessageBox
            title={messageBoxTitle}
            content={messageBoxContent}
            type={messageBoxType}
            onClose={hideCustomMessageBox}
          />
        )}
      </AnimatePresence>
    </div>
  );
}