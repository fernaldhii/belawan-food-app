// app/components/CartContext.jsx
"use client";

import React, { createContext, useState, useEffect, useCallback } from 'react';

// Firebase imports
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithCustomToken, signInAnonymously } from 'firebase/auth'; 
import { getFirestore, collection, addDoc, getDocs, onSnapshot, query } from 'firebase/firestore';

// Buat CartContext
export const CartContext = createContext();

// --- KONFIGURASI FIREBASE ANDA ---
const localFirebaseConfig = {
  apiKey: "AIzaSyDp3-v-HU02vsUfPHpmNdetpUUB_DPyOK0",
  authDomain: "umkm-belawan.firebaseapp.com",
  projectId: "umkm-belawan",
  storageBucket: "umkm-belawan.firebasestorage.app",
  messagingSenderId: "952896654123",
  appId: "1:952896654123:web:fcc246252e2e47e72c936e",
  measurementId: "G-N8SQ9W5HR4"
};

const firebaseConfig = typeof window !== 'undefined' && typeof __firebase_config !== 'undefined'
  ? JSON.parse(__firebase_config)
  : localFirebaseConfig;

const appIdentifier = typeof window !== 'undefined' && typeof __app_id !== 'undefined'
  ? __app_id
  : localFirebaseConfig.projectId;

console.log("--- CartContext: Firebase Config Check ---");
console.log("appIdentifier:", appIdentifier);
console.log("apiKey:", firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 5)}...` : "UNDEFINED/EMPTY");
console.log("-----------------------------------------");

let firebaseAppInstance;
let firebaseAuthInstance;
let firestoreDbInstance;
let globalFirebaseInitError = null;

// Inisialisasi Firebase App, Auth, dan Firestore di luar komponen React.
try {
  const existingApps = getApps();
  const existingDefaultApp = existingApps.find(app => app.name === '[DEFAULT]');

  if (existingDefaultApp) {
    firebaseAppInstance = getApp('[DEFAULT]');
    console.log("CartContext: Firebase App '[DEFAULT]' already exists. Reusing it.");
  } else {
    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
        throw new Error("Firebase configuration is incomplete. Missing apiKey, authDomain, or projectId.");
    }
    firebaseAppInstance = initializeApp(firebaseConfig);
    console.log("CartContext: New Firebase App '[DEFAULT]' initialized.");
  }

  firebaseAuthInstance = getAuth(firebaseAppInstance);
  firestoreDbInstance = getFirestore(firebaseAppInstance);
  console.log("CartContext: Firebase Auth and Firestore instances retrieved successfully.");
} catch (error) {
  console.error("CartContext: Failed to initialize or retrieve Firebase instances globally:", error);
  globalFirebaseInitError = error;
}

// Data menuItems awal untuk seeding (menggunakan ID yang Anda berikan)
const seedMenuItems = [
  { id: 'cumi-asam-manis', name: "Cumi Asam Manis", category: "Cumi/Udang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Cumi",
    options: { spicyLevel: ["Biasa", "Pedas"], size: [{ label: "Kecil", price: 35000}, { label: "Besar", price: 40000}] } },
  { id: 'cumi-saus-padang', name: "Cumi Saus Padang", category: "Cumi/Udang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Cumi",
    options: { spicyLevel: ["Biasa", "Pedas"], size: [{ label: "Kecil", price: 35000}, { label: "Besar", price: 40000}] } },
  { id: 'cumi-saus-tiram', name: "Cumi Saus Tiram", category: "Cumi/Udang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Cumi",
    options: { spicyLevel: ["Biasa", "Pedas"], size: [{ label: "Kecil", price: 35000}, { label: "Besar", price: 40000}] } },
  { id: 'cumi-goreng-tepung', name: "Cumi Goreng Tepung", category: "Cumi/Udang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Cumi",
    options: { size: [{ label: "Kecil", price: 35000}, { label: "Besar", price: 40000}] } },
  { id: 'cumi-kremes', name: "Cumi Kremes", category: "Cumi/Udang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Cumi",
    options: { size: [{ label: "Kecil", price: 35000}, { label: "Besar", price: 40000}] } },
  { id: 'cumi-saus-mentega', name: "Cumi Saus Mentega", category: "Cumi/Udang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Cumi",
    options: { size: [{ label: "Kecil", price: 35000}, { label: "Besar", price: 40000}] } },
  { id: 'cumi-sambal-pete', name: "Cumi Sambal Pete", category: "Cumi/Udang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Cumi",
    options: { spicyLevel: ["Pedas", "Sangat Pedas"], size: [{ label: "Kecil", price: 35000}, { label: "Besar", price: 40000}] } },
  { id: 'cumi-tauco', name: "Cumi Tauco", category: "Cumi/Udang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Cumi",
    options: { spicyLevel: ["Biasa", "Pedas"], size: [{ label: "Kecil", price: 35000}, { label: "Besar", price: 40000}] } },
  { id: 'udang-rebus', name: "Udang Rebus", category: "Cumi/Udang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Udang",
    options: { size: [{ label: "Kecil", price: 35000}, { label: "Besar", price: 40000}] } },
  { id: 'ikan-bawal', name: "Ikan Bawal", category: "Ikan", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ikan", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 35000 },
  { id: 'ikan-kerapu', name: "Ikan Kerapu", category: "Ikan", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ikan", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 38000 },
  { id: 'ikan-kwe', name: "Ikan Kwe", category: "Ikan", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ikan", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 38000 },
  { id: 'ikan-gurame', name: "Ikan Gurame", category: "Ikan", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ikan", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 45000 },
  { id: 'ikan-nila', name: "Ikan Nila", category: "Ikan", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ikan", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 25000 },
  { id: 'kepiting', name: "Kepiting", category: "Kepiting", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Kepiting", options: { spicyLevel: ["Biasa", "Pedas"], rasaMenu: ["Lada Hitam", "Asam Manis", "Saus Padang", "Saus Tiram"], }, price: 50000 },
  { id: 'kerang', name: "Kerang", category: "Kerang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Kerang", options: { spicyLevel: ["Biasa", "Pedas"], rasaMenu: ["Lada Hitam", "Asam Manis", "Saus Padang", "Saus Tiram", "Mentega"], }, price: 25000 },
  { id: 'kerang-rebus', name: "Kerang Rebus", category: "Kerang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Kerang", options: { }, price: 20000 },
  { id: 'kerang-hijau-goreng', name: "Kerang Hijau Goreng", category: "Kerang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Kerang", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 20000 },
  { id: 'capcai-goreng', name: "Capcai Goreng", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Capcai", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 23000 },
  { id: 'capcai-rebus', name: "Capcai Rebus", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Capcai", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 23000 },
  { id: 'nasi-capcai', name: "Nasi Capcai", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Nasi", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 25000 },
  { id: 'nasi-sapo', name: "Nasi Sapo", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Nasi", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 31000 },
  { id: 'sapo-tahu-hotplate', name: "Sapo Tahu Hotplate", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Tahu", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 28000 },
  { id: 'sapo-tahu-ori-belawan', name: "Sapo Tahu Ori Belawan", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Tahu", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 28000 },
  { id: 'sapo-tahu-masak-pedas', name: "Sapo Tahu Masak Pedas", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Tahu", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 28000 },
  { id: 'fuyunghai', name: "Fuyunghai", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Fuyunghai", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 22000 },
  { id: 'toge-ikan-asin', name: "Toge Ikan Asin", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Toge", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 20000 },
  { id: 'kangkung-tumis-belacan', name: "Kangkung Tumis Belacan", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Kangkung", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 15000 },
  { id: 'kangkung-tumis', name: "Kangkung Tumis", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Kangkung", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 20000 },
  { id: 'kangkung-tumis-hotplate', name: "Kangkung Tumis Hotplate", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Kangkung", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 20000 },
  { id: 'tongseng-kambing', name: "Tongseng Kambing", category: "Tongseng", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Tongseng", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 25000 },
  { id: 'tongseng-sapi', name: "Tongseng Sapi", category: "Tongseng", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Tongseng", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 21000 },
  { id: 'tongseng-ayam', name: "Tongseng Ayam", category: "Tongseng", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Tongseng", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 21000 },
  { id: 'mie-goreng', name: "Mie Goreng", category: "Mie", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Mie", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 28000 },
  { id: 'mie-rebus', name: "Mie Rebus", category: "Mie", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Mie", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 28000 },
  { id: 'kwetiaw-goreng', name: "Kwetiaw Goreng", category: "Mie", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Kwetiaw", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 28000 },
  { id: 'kwetiaw-rebus', name: "Kwetiaw Rebus", category: "Mie", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Kwetiaw", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 28000 },
  { id: 'bihun-goreng', name: "Bihun Goreng", category: "Mie", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Bihun", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 28000 },
  { id: 'bihun-rebus', name: "Bihun Rebus", category: "Mie", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Bihun", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 28000 },
  { id: 'ifumie-belawan', name: "Ifumie Belawan", category: "Mie", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ifumie", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 30000 },
  { id: 'spagety', name: "Spagety", category: "Mie", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Spagety", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 30000 },
  { id: 'ayam-mentega', name: "Ayam Mentega", category: "Ayam", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ayam", options: { spicyLevel: ["Biasa", "Pedas"], size: [{ label: "Kecil", price: 27000}, { label: "Besar", price: 30000}] } },
  { id: 'ayam-rica-rica', name: "Ayam Rica-Rica", category: "Ayam", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ayam", options: { spicyLevel: ["Biasa", "Pedas"], size: [{ label: "Kecil", price: 27000}, { label: "Besar", price: 30000}] } },
  { id: 'ayam-woku', name: "Ayam Woku", category: "Ayam", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ayam", options: { spicyLevel: ["Biasa", "Pedas"], size: [{ label: "Kecil", price: 27000}, { label: "Besar", price: 30000}] } },
  { id: 'ayam-kuluyuk', name: "Ayam Kuluyuk", category: "Ayam", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ayam", options: { spicyLevel: ["Biasa", "Pedas"], size: [{ label: "Kecil", price: 27000}, { label: "Besar", price: 30000}] } },
  { id: 'ayam-cah-jamur', name: "Ayam Cah Jamur", category: "Ayam", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ayam", options: { spicyLevel: ["Biasa", "Pedas"], size: [{ label: "Kecil", price: 27000}, { label: "Besar", price: 30000}] } },
  { id: 'ayam-lada-hitam', name: "Ayam Lada Hitam", category: "Ayam", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ayam", options: { spicyLevel: ["Biasa", "Pedas"], size: [{ label: "Kecil", price: 27000}, { label: "Besar", price: 30000}] } },
  { id: 'ayam-bistik', name: "Ayam Bistik", category: "Ayam", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ayam", options: { spicyLevel: ["Biasa", "Pedas"], size: [{ label: "Kecil", price: 30000}, { label: "Besar", price: 35000}] } },
  { id: 'chicken-katsu', name: "Chicken Katsu", category: "Ayam", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Chicken", options: { spicyLevel: ["Biasa", "Pedas"], size: [{ label: "Kecil", price: 30000}, { label: "Besar", price: 35000}] } },
  { id: 'fried-chicken-belawan', name: "Fried Chicken Belawan", category: "Ayam", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Chicken", options: { spicyLevel: ["Biasa", "Pedas"], size: [{ label: "Kecil", price: 30000}, { label: "Besar", price: 35000}] } },
  { id: 'ayam-biasa', name: "Ayam", category: "Ayam", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ayam", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 20000 },
  { id: 'empek-empek-kapal-selam', name: "Empek-Empek Kapal Selam", category: "Empek-empek", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Pempek", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 17000 },
  { id: 'empek-empek-lenjer', name: "Empek-Empek Lenjer", category: "Empek-empek", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Pempek", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 10000 },
  { id: 'empek-empek-adaan', name: "Empek-Empek Adaan", category: "Empek-empek", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Pempek", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 8000 },
  { id: 'empek-empek-tahu', name: "Empek-Empek Tahu", category: "Empek-empek", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Pempek", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 12000 },
  { id: 'empek-empek-kulit', name: "Empek-Empek Kulit", category: "Empek-empek", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Pempek", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 10000 },
  { id: 'pempek-lenggang', name: "Pempek Lenggang", category: "Empek-empek", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Pempek", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 15000 },
  { id: 'tekwan', name: "Tekwan", category: "Empek-empek", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Tekwan", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 15000 },
  { id: 'bebek-lada-hitam', name: "Bebek Lada Hitam", category: "Bebek", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Bebek", options: { spicyLevel: ["Biasa", "Pedas"], size: [{ label: "Kecil", price: 35000}, { label: "Besar", price: 40000}] } },
  { id: 'soup-iga-sapi', name: "Soup Iga Sapi", category: "Soup", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Soup", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 28000 },
  { id: 'sop-iga-bakar', name: "Sop Iga Bakar", category: "Soup", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Soup", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 35000 },
  { id: 'sop-buntut', name: "Sop Buntut", category: "Soup", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Soup", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 42000 },
  { id: 'nasi-goreng-ayam', name: "Nasi Goreng Ayam", category: "Nasi Goreng", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Nasi", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 23000 },
  { id: 'nasi-goreng-pete', name: "Nasi Goreng Pete", category: "Nasi Goreng", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Nasi", options: { spicyLevel: ["Biasa", "Pedas"], }, price: 23000 },
  { id: 'nasi-putih', name: "Nasi Putih", category: "Lain-lain", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Nasi", options: { }, price: 5000 },
  { id: 'nasi-uduk', name: "Nasi Uduk", category: "Lain-lain", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Nasi", options: { }, price: 6000 },
  { id: 'tahu-tempe-goreng', name: "Tahu/Tempe Goreng", category: "Lain-lain", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Tahu", options: { }, price: 5000 },
  { id: 'sambal-hijau', name: "Sambal Hijau", category: "Lain-lain", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Sambal", options: { }, price: 5000 },
];


// Data kategori awal untuk seeding
const seedCategories = [
  "All",
  "Cumi/Udang",
  "Ikan",
  "Sayuran",
  "Tongseng",
  "Mie",
  "Ayam",
  "Bebek",
  "Empek-empek",
  "Soup",
  "Nasi Goreng",
  "Kepiting",
  "Kerang",
  "Lain-lain",
];


export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isClient, setIsClient] = useState(false);

  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [user, setUser] = useState(null); 
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [checkedAuth, setCheckedAuth] = useState(false); // <--- STATE BARU INI
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [hasSeeded, setHasSeeded] = useState(false);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  // === State dan fungsi baru untuk Sidebar Profil ===
  const [isProfileSidebarOpen, setIsProfileSidebarOpen] = useState(false); 
  const toggleProfileSidebar = useCallback(() => { 
    setIsProfileSidebarOpen(prev => !prev);
  }, []);
  // =================================================

  useEffect(() => {
    setIsClient(true);

    const savedCart = localStorage.getItem('belawanFoodCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    if (globalFirebaseInitError) {
      console.error("CartContext: Global Firebase initialization error detected:", globalFirebaseInitError);
      setIsAuthReady(false);
      setCheckedAuth(true); // <--- Pastikan ini juga disetel jika ada error inisialisasi
      setIsLoadingMenu(false);
      return;
    }

    if (!firebaseAuthInstance || !firestoreDbInstance) {
      console.error("CartContext: Firebase Auth or Firestore instances not available. Cannot proceed with authentication or data fetching.");
      setIsAuthReady(false);
      setCheckedAuth(true); // <--- Pastikan ini juga disetel
      setIsLoadingMenu(false);
      return;
    }

    setAuth(firebaseAuthInstance);
    setDb(firestoreDbInstance);

    const unsubscribe = onAuthStateChanged(firebaseAuthInstance, async (currentUser) => { 
      if (currentUser) {
        setUser(currentUser); 
        setUserId(currentUser.uid);
        console.log("CartContext: Auth State Changed: User is signed in with UID:", currentUser.uid, "Anonymous:", currentUser.isAnonymous);
      } else {
        setUser(null); 
        setUserId(null);
        console.log("CartContext: Auth State Changed: No user signed in (initial check).");
      }
      setIsAuthReady(true); 
      setCheckedAuth(true); // <--- INI PENTING! Set menjadi true setelah cek awal selesai
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('belawanFoodCart', JSON.stringify(cart));
    }
  }, [cart, isClient]);

  // Efek untuk Seeding Data
  useEffect(() => {
    if (isAuthReady && db && !hasSeeded) {
      const menuCollectionRef = collection(db, `artifacts/${appIdentifier}/public/data/menu_items`);
      const categoryCollectionRef = collection(db, `artifacts/${appIdentifier}/public/data/categories`);

      const checkAndSeedData = async () => {
        try {
          const menuSnapshot = await getDocs(query(menuCollectionRef));
          const categorySnapshot = await getDocs(query(categoryCollectionRef));

          if (menuSnapshot.empty || categorySnapshot.empty) {
            console.log("CartContext: Collections are empty. Seeding initial data...");
            
            if (menuSnapshot.empty) {
                console.log("CartContext: Seeding menu items...");
                await Promise.all(seedMenuItems.map(item => addDoc(menuCollectionRef, { ...item })));
                console.log("CartContext: Menu items seeded successfully.");
            } else {
                console.log("CartContext: Menu items already exist, skipping menu seeding.");
            }

            if (categorySnapshot.empty) {
                console.log("CartContext: Seeding category data...");
                await Promise.all(seedCategories.map(catName => addDoc(categoryCollectionRef, { name: catName })));
                console.log("CartContext: Category data seeded successfully.");
            } else {
                console.log("CartContext: Categories already exist, skipping category seeding.");
            }
          } else {
            console.log("CartContext: Data already seeded, skipping seeding process.");
          }
          setHasSeeded(true);
        } catch (error) {
          console.error("CartContext: Error during seeding data or initial data check:", error);
          setHasSeeded(true);
        }
      };

      checkAndSeedData();
    } else if (!db) {
      console.warn("CartContext: Firestore DB instance not available for seeding (waiting).");
    } else if (!isAuthReady) {
      console.warn("CartContext: Auth not ready for seeding (waiting).");
    } else if (hasSeeded) {
      console.log("CartContext: Data already seeded in this session, skipping seeding process.");
    }
  }, [isAuthReady, db, hasSeeded, appIdentifier]);


  // Efek untuk Listener Realtime untuk menuItems dan categories
  useEffect(() => {
    if (isAuthReady && db) {
      console.log("CartContext: Setting up real-time Firestore listeners for menu_items and categories.");
      const menuCollectionRef = collection(db, `artifacts/${appIdentifier}/public/data/menu_items`);
      const categoryCollectionRef = collection(db, `artifacts/${appIdentifier}/public/data/categories`);

      const unsubscribeMenuItems = onSnapshot(query(menuCollectionRef), (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        setMenuItems(items);
        setIsLoadingMenu(false);
        console.log("CartContext: Fetched menu items in real-time:", items.length);
      }, (error) => {
        console.error("CartContext: Error fetching menu items:", error);
        setIsLoadingMenu(false);
      });

      const unsubscribeCategories = onSnapshot(query(categoryCollectionRef), (snapshot) => {
        const fetchedCats = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
        
        const uniqueCategoriesMap = new Map();

        uniqueCategoriesMap.set('All', { id: 'all-category-fixed', name: 'All' });

        fetchedCats.forEach(cat => {
          if (!uniqueCategoriesMap.has(cat.name)) {
            uniqueCategoriesMap.set(cat.name, cat);
          } else {
            console.warn(`CartContext: Skipping duplicate category name '${cat.name}' (Firestore ID: ${cat.id}). Keeping the first unique entry.`);
          }
        });
        
        const finalCategoryArray = Array.from(uniqueCategoriesMap.values());
        setCategories(finalCategoryArray);
        console.log("CartContext: Fetched categories in real-time (deduplicated by name):", finalCategoryArray.map(c => c.name));
      }, (error) => {
        console.error("CartContext: Error fetching categories:", error);
      });

      return () => {
        console.log("CartContext: Unsubscribed from Firestore listeners.");
        unsubscribeMenuItems();
        unsubscribeCategories();
      };
    } else {
        console.log("CartContext: Skipping real-time listeners setup (Auth not ready or DB not available).");
    }
  }, [isAuthReady, db, appIdentifier]);

  const addToCart = useCallback((item) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (cartItem) =>
          cartItem.id === item.id &&
          JSON.stringify(cartItem.selectedOptions) === JSON.stringify(item.selectedOptions)
      );

      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += item.quantity;
        return updatedCart;
      } else {
        return [...prevCart, { ...item, cartId: Date.now() + Math.random() }]; 
      }
    });
  }, []);

  const updateQuantity = useCallback((cartId, newQuantity) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.cartId === cartId ? { ...item, quantity: newQuantity } : item
      ).filter(item => item.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((cartId) => {
    setCart((prevCart) => prevCart.filter((item) => item.cartId !== cartId));
  }, []);

  const getTotalPrice = useCallback(() => {
    return cart.reduce((total, item) => total + (item.selectedSizePrice || item.price || 0) * item.quantity, 0);
  }, [cart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const isItemInCart = useCallback((itemId) => {
    return cart.some((item) => item.id === itemId); 
  }, [cart]);


  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      updateQuantity,
      removeFromCart,
      getTotalPrice,
      clearCart,
      isItemInCart,
      db: firestoreDbInstance, 
      auth: firebaseAuthInstance, 
      user, 
      userId,
      isAuthReady,
      checkedAuth, // <--- EXPOSE STATE BARU INI
      menuItems,
      categories,
      appIdentifier,
      isLoadingMenu,
      isProfileSidebarOpen, 
      toggleProfileSidebar, 
    }}>
      {children}
    </CartContext.Provider>
  );
}
