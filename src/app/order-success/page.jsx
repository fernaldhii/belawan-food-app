// app/order-success/page.jsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, onSnapshot, orderBy } from 'firebase/firestore';

// --- PENTING: KONFIGURASI FIREBASE ---
// Untuk pengembangan lokal, kita akan menggunakan konfigurasi yang Anda sediakan secara hardcode.
// Saat di-deploy ke lingkungan Canvas, akan otomatis menggunakan variabel global yang disediakan.

const localFirebaseConfig = {
  apiKey: "AIzaSyDp3-v-HU02vsUfPHpmNdetpUUB_DPyOK0",
  authDomain: "umkm-belawan.firebaseapp.com",
  projectId: "umkm-belawan",
  storageBucket: "umkm-belawan.firebasestorage.app",
  messagingSenderId: "952896654123",
  appId: "1:952896654123:web:fcc246252e2e47e72c936e",
  // measurementId: "G-N8SQ9W5HR4" // (opsional)
};

const firebaseConfig = typeof window !== 'undefined' && typeof __firebase_config !== 'undefined'
  ? JSON.parse(__firebase_config)
  : localFirebaseConfig;

const appIdentifier = typeof window !== 'undefined' && typeof __app_id !== 'undefined'
  ? __app_id
  : localFirebaseConfig.projectId;

console.log("--- Firebase Config Check (OrderSuccessPage) ---");
console.log("Using Firebase Config (local/global):", firebaseConfig === localFirebaseConfig ? "LOCAL" : "GLOBAL");
console.log("apiKey:", firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 5)}...` : "UNDEFINED/EMPTY");
console.log("authDomain:", firebaseConfig.authDomain || "UNDEFINED/EMPTY");
console.log("projectId (appIdentifier):", appIdentifier || "UNDEFINED/EMPTY");
console.log("appId:", firebaseConfig.appId || "UNDEFINED/EMPTY");
console.log("-----------------------------------------");

// Inisialisasi Firebase App, Auth, dan Firestore secara global
let firebaseAppInstance;
let firebaseAuthInstance;
let firestoreDbInstance;
let globalFirebaseInitError = null;

if (!firebaseConfig || !firebaseConfig.apiKey || !firebaseConfig.projectId) {
  globalFirebaseInitError = new Error("Firebase configuration is incomplete or not found. Cannot initialize Firebase.");
  console.error(globalFirebaseInitError.message);
} else {
  try {
    const existingDefaultApp = getApps().find(app => app.name === '[DEFAULT]');
    if (existingDefaultApp) {
      firebaseAppInstance = getApp('[DEFAULT]');
      console.log("Firebase App '[DEFAULT]' already exists. Reusing it.");
    } else {
      firebaseAppInstance = initializeApp(firebaseConfig);
      console.log("New Firebase App '[DEFAULT]' initialized.");
    }

    firebaseAuthInstance = getAuth(firebaseAppInstance);
    firestoreDbInstance = getFirestore(firebaseAppInstance);
    console.log("Firebase Auth and Firestore instances retrieved successfully.");
  } catch (error) {
    console.error("Failed to initialize or retrieve Firebase instances globally (OrderSuccessPage):", error);
    globalFirebaseInitError = error;
  }
}

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isUserAnonymous, setIsUserAnonymous] = useState(false); // State baru untuk melacak anonimitas

  const showSuccessMessage = searchParams.get('from') === 'whatsapp';

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

  const showCustomMessageBox = (title, content, type = 'info') => {
    setError({ title, content, type });
  };

  const hideCustomMessageBox = () => {
    setError(null);
  };

  useEffect(() => {
    if (globalFirebaseInitError) {
        console.error("Global Firebase initialization error detected in OrderSuccessPage:", globalFirebaseInitError);
        showCustomMessageBox("Error Inisialisasi Firebase", `Terjadi kesalahan saat menginisialisasi Firebase: ${globalFirebaseInitError.message}. Pastikan konfigurasi Anda benar dan layanan diaktifkan.`, "error");
        setLoading(false);
        return;
    }

    if (!firebaseAuthInstance) {
      console.error("Firebase Auth instance is not available. Cannot proceed with authentication.");
      showCustomMessageBox("Error", "Layanan autentikasi tidak tersedia. Mohon coba lagi nanti.", "error");
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(firebaseAuthInstance, (user) => {
      if (user) {
        setUserId(user.uid);
        setIsUserAnonymous(user.isAnonymous); // Set status anonimitas
        setIsAuthReady(true);
        console.log("Auth State Changed in OrderSuccessPage: User UID:", user.uid, "Anonymous:", user.isAnonymous);
      } else {
        setUserId(null); 
        setIsUserAnonymous(true); 
        setIsAuthReady(true); 
        console.log("Auth State Changed in OrderSuccessPage: No user signed in (or was anonymous).");
      }
      setLoading(false); 
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Hanya fetch data jika auth siap, ada userId, dan pengguna TIDAK anonim
    if (isAuthReady && userId && firestoreDbInstance && !isUserAnonymous) {
      console.log(`Attempting to fetch orders for userId: ${userId} at path: artifacts/${appIdentifier}/users/${userId}/orders`);
      const ordersCollectionRef = collection(firestoreDbInstance, `artifacts/${appIdentifier}/users/${userId}/orders`);

      const q = query(ordersCollectionRef, orderBy('timestamp', 'desc')); 
      
      const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        const orders = [];
        snapshot.forEach((doc) => {
          orders.push({ id: doc.id, ...doc.data() });
        });
        setOrderHistory(orders);
        console.log("Orders fetched successfully:", orders);
      }, (firestoreError) => {
        console.error("Error fetching orders from Firestore:", firestoreError);
        showCustomMessageBox("Error Mengambil Pesanan", `Gagal mengambil riwayat pesanan: ${firestoreError.message}. Silakan coba lagi.`, "error");
      });

      return () => unsubscribeFirestore();
    } else if (isAuthReady && isUserAnonymous) {
      console.log("User is anonymous. Skipping order history fetch.");
    } else {
        console.log("Firestore fetch skipped: Auth not ready or userId not available or DB instance missing.", { isAuthReady, userId, firestoreDbInstance: !!firestoreDbInstance });
    }
  }, [isAuthReady, userId, isUserAnonymous, appIdentifier]); 

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-600 text-lg mb-4">Memuat riwayat pesanan...</p>
        <div className="flex justify-center items-center">
            <svg className="animate-spin h-8 w-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      // Padding vertikal keseluruhan halaman
      className="min-h-screen bg-gray-50 text-gray-800 py-16 px-4 md:px-20 flex flex-col items-center"
    >
      <div 
        // Mengubah p-8 menjadi pt-12 untuk padding atas yang lebih besar
        // px-8 dan pb-8 tetap sama
        className="max-w-3xl w-full bg-white px-8 pt-10 mt-8 pb-8 rounded-xl shadow-lg text-center border border-gray-200 relative"
      >
        {/* Tombol Kembali */}
        <div className="absolute top-4 left-4">
          <Link href="/menu" className="flex items-center text-gray-600 hover:text-gray-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="hidden sm:inline">Kembali</span>
          </Link>
        </div>

        {/* Kondisi untuk menampilkan pesan sukses (akan tetap muncul terlepas dari status anonim) */}
        {showSuccessMessage && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <svg className="w-20 h-20 text-green-500 mx-auto mb-6" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {/* Ukuran h1 disesuaikan ke text-xl md:text-2xl */}
              <h1 className="text-xl md:text-2xl font-bold text-green-700 mb-4">Pesanan Berhasil Disimpan!</h1>
              <p className="text-lg text-gray-600 mb-8">
                Pesanan Anda telah berhasil disimpan.
              </p>
            </motion.div>
          </AnimatePresence>
        )}

        {/* RIWAYAT PESANAN (KONDISIONAL) */}
        {isUserAnonymous ? (
          <div className="text-center bg-gray-100 rounded-lg shadow-inner mt-4 p-8"> 
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">Riwayat Pesanan Tidak Tersedia</h2>
            <p className="text-gray-600 text-sm mb-6"> 
              Untuk melihat riwayat pesanan Anda, silakan login atau daftar dengan akun.
            </p>
            <Link
              href="/login?mode=forceLogin" 
              className="px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition text-md font-semibold" 
            >
              Login / Daftar
            </Link>
          </div>
        ) : (
          <>
            
            {orderHistory.length === 0 ? (
              <div className="text-center py-10 bg-gray-100 rounded-lg shadow-inner mt-4">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-800 text-center mb-4">Riwayat Pesanan <br/> Anda</h2>
                <p className="text-gray-600 text-sm mb-6">Anda belum memiliki <br/>riwayat pesanan.</p>
                <button
                  onClick={() => router.push('/menu')}
                  className="px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition text-md font-semibold"
                >
                  Lihat Menu
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {orderHistory.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200"
                  >
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                      <div>
                        {/* Ukuran h3 disesuaikan ke text-xl */}
                        <h3 className="text-xl font-semibold text-gray-800">Pesanan ID: {order.id.substring(0, 8)}...</h3>
                        <p className="text-sm text-gray-500">Waktu Pesanan: {order.orderTime}</p>
                      </div>
                      <span className="text-xl font-bold text-orange-600">
                        Rp {order.total ? order.total.toLocaleString('id-ID') : '0'}
                      </span>
                    </div>

                    <div className="mb-4 text-left">
                      <h4 className="text-lg font-semibold text-gray-700 mb-2">Detail Pengiriman:</h4>
                      {/* Menambahkan text-sm pada p tags ini */}
                      <p className="text-gray-600 text-sm">Nama: {order.deliveryDetails?.name || '-'}</p>
                      <p className="text-gray-600 text-sm">Alamat: {order.deliveryDetails?.address || '-'}</p>
                      <p className="text-gray-600 text-sm">Telepon: {order.deliveryDetails?.phone || '-'}</p>
                      {order.deliveryDetails?.notes && (
                        <p className="text-gray-600 text-sm">Catatan: {order.deliveryDetails.notes}</p>
                      )}
                    </div>

                    <div className="text-left">
                      <h4 className="text-lg font-semibold text-gray-700 mb-2">Item Pesanan:</h4>
                      {order.items && order.items.length > 0 ? (
                        <ul className="space-y-2">
                          {order.items.map((item, itemIndex) => (
                            <li key={item.cartId || itemIndex} className="flex items-center space-x-3 bg-white p-3 rounded-md shadow-sm">
                              <img
                                src={item.image || `https://placehold.co/60x60/E0E0E0/333333?text=${item.name ? item.name.replace(/\s/g, '+') : 'Item'}`}
                                alt={item.name || 'Item'}
                                className="w-16 h-16 object-cover rounded-md"
                                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/60x60/E0E0E0/333333?text=${item.name ? item.name.replace(/\s/g, '+') : 'Item'}`; }}
                              />
                              <div className="flex-grow">
                                {/* Menambahkan text-sm pada p ini */}
                                <p className="font-medium text-gray-800 text-sm">{item.name || 'Item Tidak Dikenal'} x {item.quantity || 1}</p>
                                {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                  <p className="text-sm text-gray-500">
                                      {Object.entries(item.selectedOptions)
                                      .map(([key, value]) => `${value}`)
                                      .join(', ')}
                                  </p>
                                )}
                                <p className="text-sm text-orange-600">Rp {(item.price * (item.quantity || 1)).toLocaleString('id-ID')}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 italic text-sm">Tidak ada item dalam pesanan ini.</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Tampilkan User ID untuk Debugging */}
      {userId && isAuthReady && (
          <div className="mt-8 text-center text-xs text-gray-500">
              <p>ID Pengguna Anda <br/> (untuk debug): <span className="font-mono break-all text-gray-700">{userId}</span></p>
          </div>
      )}

      {/* Custom Message Box untuk error */}
      <AnimatePresence>
        {error && (
          <MessageBox
            title={error.title}
            content={error.content}
            type={error.type}
            onClose={hideCustomMessageBox}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
