// app/login/page.jsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Import Firebase Auth untuk signInAnonymously, Phone, Google
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [messageBoxTitle, setMessageBoxTitle] = useState('');
  const [messageBoxContent, setMessageBoxContent] = useState('');
  const [messageBoxType, setMessageBoxType] = useState('info');

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [confirmationResultObject, setConfirmationResultObject] = useState(null); 
  const recaptchaVerifierRef = useRef(null);
  const [recaptchaResolved, setRecaptchaResolved] = useState(false);
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);

  // States baru untuk instance Firebase yang dikelola secara lokal
  const [appInstance, setAppInstance] = useState(null);
  const [authInstance, setAuthInstance] = useState(null);
  const [dbInstance, setDbInstance] = useState(null);
  const [firebaseInitError, setFirebaseInitError] = useState(null);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false); // Overall Firebase ready state

  // === START: State baru untuk mengontrol pengalihan setelah pesan ditutup ===
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

  // useEffect untuk RecaptchaVerifier (tergantung pada authInstance)
  useEffect(() => {
    if (!isFirebaseReady || firebaseInitError) {
        console.log("[LoginPage reCAPTCHA Init] Firebase not ready or has error. Skipping reCAPTCHA initialization.");
        setIsRecaptchaReady(false);
        return;
    }

    if (!authInstance) {
      console.log("[LoginPage reCAPTCHA Init] Auth instance not available for reCAPTCHA. Skipping init.");
      setIsRecaptchaReady(false);
      return;
    }

    if (recaptchaVerifierRef.current) {
      console.log("[LoginPage reCAPTCHA Init] reCAPTCHA verifier already exists. Skipping init.");
      setIsRecaptchaReady(true); // Jika sudah ada, anggap siap
      return;
    }

    console.log("[LoginPage reCAPTCHA Init] Attempting to initialize reCAPTCHA verifier...");
    setIsRecaptchaReady(false); 
    try {
      window.recaptchaVerifier = new RecaptchaVerifier(authInstance, 'recaptcha-container', { // Gunakan authInstance
        'size': 'invisible', 
        'callback': (response) => {
          console.log("reCAPTCHA solved:", response);
          setRecaptchaResolved(true);
        },
        'expired-callback': () => {
          console.log("reCAPTCHA expired. Resetting recaptchaResolved.");
          setRecaptchaResolved(false);
          showCustomMessageBox("Verifikasi Kedaluwarsa", "Verifikasi keamanan telah kedaluwarsa. Mohon coba lagi.", "error");
          if (recaptchaVerifierRef.current && typeof recaptchaVerifierRef.current.reset === 'function') {
              recaptchaVerifierRef.current.reset();
          }
        }
      });
      recaptchaVerifierRef.current = window.recaptchaVerifier;
      window.recaptchaVerifier.render().then(() => {
          console.log("reCAPTCHA verifier rendered successfully. Setting isRecaptchaReady to true.");
          setIsRecaptchaReady(true); 
      }).catch(err => {
          console.error("Error rendering reCAPTCHA verifier:", err);
          showCustomMessageBox("Error reCAPTCHA", `Gagal me-render verifikasi keamanan: ${err.message}. Mohon coba lagi nanti.`, "error");
          setIsRecaptchaReady(false); 
      });
    } catch (error) {
      console.error("Failed to initialize RecaptchaVerifier:", error);
      showCustomMessageBox("Error reCAPTCHA", `Gagal memuat verifikasi keamanan: ${error.message}. Mohon coba lagi nanti.`, "error");
      setIsRecaptchaReady(false); 
    }
    
    return () => {
      if (typeof window !== 'undefined' && recaptchaVerifierRef.current) {
        console.log("Cleaning up reCAPTCHA verifier.");
        recaptchaVerifierRef.current.clear(); 
        recaptchaVerifierRef.current = null;
        if (window.recaptchaVerifier) {
            delete window.recaptchaVerifier; 
        }
        setRecaptchaResolved(false);
        setIsRecaptchaReady(false); 
      }
    };
  }, [authInstance, isFirebaseReady, firebaseInitError]); // Bergantung pada authInstance dan isFirebaseReady

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

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!authInstance) { // Gunakan authInstance
      showCustomMessageBox("Error", "Layanan autentikasi tidak tersedia.", "error");
      setIsLoading(false);
      return;
    }
    if (!recaptchaVerifierRef.current || typeof recaptchaVerifierRef.current.execute !== 'function') {
      showCustomMessageBox("Error", "Verifikasi keamanan (reCAPTCHA) belum dimuat atau tidak siap. Mohon tunggu beberapa saat dan coba lagi.", "error");
      setIsLoading(false);
      return;
    }
    if (!isRecaptchaReady) {
        showCustomMessageBox("Error", "Verifikasi keamanan (reCAPTCHA) belum siap. Mohon tunggu.", "error");
        setIsLoading(false);
        return;
    }

    let formattedPhoneNumber = phoneNumber.startsWith('0') ? `+62${phoneNumber.substring(1)}` : phoneNumber;
    if (!formattedPhoneNumber.startsWith('+')) {
      formattedPhoneNumber = `+62${formattedPhoneNumber}`; 
    }

    console.log("Attempting to send OTP to:", formattedPhoneNumber);

    try {
      if (typeof recaptchaVerifierRef.current.reset === 'function') {
          recaptchaVerifierRef.current.reset();
          setRecaptchaResolved(false);
      }
      
      await recaptchaVerifierRef.current.execute(); 
      console.log("reCAPTCHA execute called successfully.");

      const confirmationResult = await signInWithPhoneNumber(authInstance, formattedPhoneNumber, recaptchaVerifierRef.current); // Gunakan authInstance
      setConfirmationResultObject(confirmationResult);
      setOtpSent(true);
      showCustomMessageBox("OTP Terkirim", `Kode verifikasi telah dikirim ke ${formattedPhoneNumber}.`, "success");
      console.log("OTP sent successfully.");
      // Tidak perlu redirect di sini, biarkan verifikasi OTP yang menangani itu.
    } catch (error) {
      console.error("Error sending OTP:", error);
      if (recaptchaVerifierRef.current && typeof recaptchaVerifierRef.current.reset === 'function') {
          recaptchaVerifierRef.current.reset();
          setRecaptchaResolved(false);
      }
      if (error.code === 'auth/missing-phone-number') {
        showCustomMessageBox("Input Error", "Mohon masukkan nomor telepon.", "error");
      } else if (error.code === 'auth/invalid-phone-number') {
        showCustomMessageBox("Input Error", "Nomor telepon tidak valid. Gunakan format internasional (contoh: +62812...).", "error");
      } else if (error.code === 'auth/quota-exceeded') {
        showCustomMessageBox("Batas Terlampaui", "Terlalu banyak permintaan OTP. Mohon coba lagi nanti.", "error");
      } else if (error.code === 'auth/captcha-check-failed') {
          showCustomMessageBox("Verifikasi Gagal", "Verifikasi keamanan gagal. Mohon coba lagi.", "error");
      } else if (error.code === 'auth/network-request-failed') {
          showCustomMessageBox("Kesalahan Jaringan", "Gagal mengirim OTP. Pastikan koneksi internet Anda stabil dan tidak ada pemblokir iklan/firewall yang aktif. Error: " + error.message, "error");
      } else if (error.code === 'auth/unauthorized-domain') {
          showCustomMessageBox("Domain Tidak Diizinkan", "Permintaan login berasal dari domain yang tidak diizinkan. Mohon periksa pengaturan Authorized Domains di Firebase Console Anda.", "error");
      } else if (error.code === 'auth/invalid-app-credential') { // Menambahkan penanganan spesifik
          showCustomMessageBox("Kesalahan Inisialisasi", "Aplikasi Firebase belum sepenuhnya siap untuk verifikasi. Mohon tunggu beberapa saat dan coba lagi.", "error");
      }
      else {
        showCustomMessageBox("Error", `Gagal mengirim OTP: ${error.message}.`, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!authInstance || !confirmationResultObject || !otp) { // Gunakan authInstance
      showCustomMessageBox("Input Error", "Kode OTP atau ID verifikasi tidak lengkap.", "error");
      setIsLoading(false);
      return;
    }

    try {
      await confirmationResultObject.confirm(otp); 

      showCustomMessageBox("Login Berhasil", "Anda berhasil masuk!", "success");
      console.log("Phone number login successful.");
      // === START: Tambahan untuk redirect setelah OTP Login ===
      // Set flag untuk redirect setelah message box ditutup
      setShouldRedirectAfterDismiss(true); 
      // === END: Tambahan untuk redirect ===

    } catch (error) {
      console.error("Error verifying OTP:", error);
      if (error.code === 'auth/invalid-verification-code') {
        showCustomMessageBox("Kode OTP Salah", "Kode verifikasi yang Anda masukkan tidak valid. Mohon coba lagi.", "error");
      } else if (error.code === 'auth/code-expired') {
        showCustomMessageBox("Kode Kadaluwarsa", "Kode verifikasi telah kadaluwarsa. Mohon kirim ulang OTP.", "error");
      } else if (error.code === 'auth/network-request-failed') {
          showCustomMessageBox("Kesalahan Jaringan", "Gagal memverifikasi OTP. Pastikan koneksi internet Anda stabil. Error: " + error.message, "error");
      } else if (error.code === 'auth/unauthorized-domain') {
          showCustomMessageBox("Domain Tidak Diizinkan", "Permintaan login berasal dari domain yang tidak diizinkan. Mohon periksa pengaturan Authorized Domains di Firebase Console Anda.", "error");
      }
      else {
        showCustomMessageBox("Error", `Gagal memverifikasi OTP: ${error.message}.`, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };


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

  console.log("LoginPage Render Cycle: isLoading =", isLoading, "isForceLoginMode =", isForceLoginMode, "isRecaptchaReady =", isRecaptchaReady, "isFirebaseReady =", isFirebaseReady); 

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
          <img src="/images/logo.png" alt="logo" className="block md:hidden w-auto h-8"/>
          <img src="/images/logo-pc.png" alt="logo" className="hidden md:block mt-6"/>
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
            {otpSent ? "Masukkan kode verifikasi yang dikirim ke nomor Anda" : "Masukkan nomor telepon Anda yang terdaftar"}
          </p>

          {!otpSent ? (
            // Form input nomor telepon
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-all duration-200">
                {/* Negara dan Kode Telepon - Representasi Visual */}
                <div className="flex items-center px-3 py-2 border-r border-gray-300 bg-gray-100 rounded-l-lg">
                  <span className="text-sm">🇮🇩</span> {/* Bendera Indonesia */}
                  <span className="ml-2 text-gray-700">+62</span>
                  <svg className="w-4 h-4 ml-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                {/* Input Nomor Telepon */}
                <input
                  type="tel"
                  className="flex-grow px-4 py-2 bg-white rounded-r-lg outline-none min-w-0"
                  placeholder="81234567890" // Contoh: 81234567890 (tanpa 0 di depan)
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <label className="flex items-center text-gray-700 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                  disabled={isLoading}
                />
                <span className="ml-2">Ingat saya di perangkat ini selama 60 hari</span>
              </label>

              <button
                type="submit"
                className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
                  isLoading || !isRecaptchaReady ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md'
                }`}
                disabled={isLoading || !isRecaptchaReady}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : "Lanjutkan"}
              </button>
              {!isRecaptchaReady && (
                  <p className="text-center text-xs text-gray-500 mt-2">Memuat verifikasi keamanan...</p>
              )}
              <div id="recaptcha-container" className="mt-4"></div>
            </form>
          ) : (
            // Form input OTP
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-100 outline-none text-center text-lg tracking-wider"
                placeholder="Masukkan OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                disabled={isLoading}
                maxLength="6"
              />
              <button
                type="submit"
                className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
                  isLoading ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md'
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : "Verifikasi OTP"}
              </button>
              <button
                type="button"
                onClick={() => { 
                  setOtpSent(false); 
                  setPhoneNumber(''); 
                  setOtp(''); 
                  setConfirmationResultObject(null);
                  setRecaptchaResolved(false); 
                  if (recaptchaVerifierRef.current && typeof recaptchaVerifierRef.current.reset === 'function') {
                      recaptchaVerifierRef.current.reset();
                  }
                }}
                className="w-full mt-2 py-2 px-4 rounded-lg font-semibold text-gray-600 hover:text-gray-800 transition"
                disabled={isLoading}
              >
                Ubah Nomor Telepon
              </button>
            </form>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">atau</span>
            </div>
          </div>

          {/* Tombol Login Sosial */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 transition font-medium"
              disabled={isLoading}
            >
              <img src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png" alt="Google" className="w-5 h-5 mr-3" />
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
            <button
              onClick={handleSkipLogin}
              className={`w-full mt-4 py-2 px-4 rounded-lg font-semibold transition ${
                isLoading ? 'text-gray-400 cursor-not-allowed' : 'text-orange-500 hover:text-orange-600'
              }`}
              disabled={isLoading}
            >
              Lewati Login
            </button>
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
        <p className="mt-2">Tidak terlihat reCAPTCHA oleh Google <Link href="#" className="text-orange-600 hover:underline">Kebijakan Privasi</Link> dan <Link href="#" className="text-orange-600 hover:underline">Ketentuan Penggunaan</Link></p>
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
