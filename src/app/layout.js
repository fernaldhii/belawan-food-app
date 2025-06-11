// app/layout.jsx
"use client";

import { Poppins } from "next/font/google";
import "./globals.css";
import { CartProvider, CartContext } from "./components/CartContext"; // Import CartContext
import Navbar from "./components/Navbar"; // Import Navbar
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useContext } from 'react'; 
import ProfileSidebar from './components/ProfileSidebar'; // Import ProfileSidebar
import { AnimatePresence } from 'framer-motion'; // Import AnimatePresence

// Firebase imports (TIDAK ADA INISIALISASI GLOBAL DI SINI)
// Inisialisasi Firebase ditangani di CartContext.jsx
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Hanya untuk listener di layout
import { getApps, getApp, initializeApp } from 'firebase/app'; // Hanya untuk pengecekan, bukan inisialisasi

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

// Catatan: Konfigurasi Firebase dan inisialisasi instance
// telah dipindahkan sepenuhnya ke CartContext.jsx
// agar dapat ditangani di sisi klien dengan benar.


export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const authListenerRef = useRef(null);

  // Deteksi halaman admin
  const isAdminPage = pathname === '/admin'; 
  // Rute publik: '/login' dan '/admin'
  const publicRoutes = ['/login', '/admin']; 

  useEffect(() => {
    console.time("LayoutAuthListenerSetup");
    console.log("[Layout Init] useEffect (Auth Listener) started.");
    
    // Pastikan Firebase Auth instance tersedia dari CartContext atau global (jika ada)
    // Untuk kasus ini, kita akan mengandalkan CartContext untuk mengelola inisialisasi Auth.
    // Kita akan menggunakan `getAuth(getApp())` jika app sudah diinisialisasi di CartContext.
    let authInstanceFromGlobal;
    try {
      if (typeof window !== 'undefined' && getApps().length > 0) {
        authInstanceFromGlobal = getAuth(getApp());
      }
    } catch (e) {
      console.error("Layout: Could not get Auth instance from global app:", e);
    }

    if (!authInstanceFromGlobal) {
      console.log("[Layout Init] Firebase Auth instance not globally available yet. Waiting for CartContext to initialize.");
      // Jika authInstanceFromGlobal belum ada, kita bisa menunggu atau menangani state loading secara pasif.
      // Untuk tujuan ini, kita akan menunggu CartContext untuk menyediakan instance auth.
      // onAuthStateChanged akan dipanggil setelah Auth diinisialisasi.
      setIsAuthChecked(false); // Tetap false sampai auth benar-benar siap
      console.timeEnd("LayoutAuthListenerSetup");
      return;
    }

    if (!authListenerRef.current) {
        console.log("[Layout Init] Subscribing to onAuthStateChanged.");
        const unsubscribe = onAuthStateChanged(authInstanceFromGlobal, (currentUser) => {
            setUser(currentUser);
            setIsAuthChecked(true); 
            console.log(`[Layout Auth Callback] onAuthStateChanged fired. User UID: ${currentUser ? currentUser.uid : "No user"}, Anonymous: ${currentUser?.isAnonymous}`);
            console.timeEnd("LayoutAuthListenerCallback");
        });
        authListenerRef.current = unsubscribe;
    } else {
        console.log("[Layout Init] Auth listener already subscribed.");
        setIsAuthChecked(true); // Jika sudah subscribe, anggap sudah dicek
    }

    console.timeEnd("LayoutAuthListenerSetup");

    return () => {
      console.log("[Layout Cleanup] useEffect (Auth Listener) cleanup.");
      if (authListenerRef.current) {
          authListenerRef.current();
          authListenerRef.current = null;
      }
    };
  }, []); 


  useEffect(() => {
    console.log(`[Layout Redirect] Triggered. isAuthChecked: ${isAuthChecked}, user: ${!!user}, pathname: ${pathname}`);
    
    if (isAuthChecked) {
      const isPublicRoute = publicRoutes.includes(pathname);
      const currentSearchParams = new URLSearchParams(window.location.search);
      const isForceLoginMode = currentSearchParams.get('mode') === 'forceLogin';
      console.log(`[Layout Redirect] isForceLoginMode: ${isForceLoginMode}`);


      if (!user) { // Tidak ada user sama sekali (belum login, belum anonim)
        // Jangan redirect jika di halaman admin, karena admin/page.jsx yang akan menangani login/akses
        if (!isPublicRoute && !isAdminPage) { 
          console.log(`[Layout Redirect] ACTION: No user. Redirecting from ${pathname} to /login`);
          router.replace('/login');
        } else {
          console.log(`[Layout Redirect] NO ACTION: No user, but on public route (${pathname}).`);
        }
      } else { // Ada user (bisa terautentikasi penuh atau anonim)
        if (pathname === '/login') {
          if (!isForceLoginMode) { 
            console.log(`[Layout Redirect] ACTION: User present (UID: ${user.uid}, Anonymous: ${user.isAnonymous}) on /login, NOT in forceLogin mode. Redirecting to /menu.`);
            router.replace('/menu');
          } else {
            console.log(`[Layout Redirect] NO ACTION: User present on /login, BUT in forceLogin mode. Allowing to stay.`);
          }
        } else {
          console.log(`[Layout Redirect] NO ACTION: User logged in (UID: ${user.uid}, Anonymous: ${user.isAnonymous}) on non-login route (${pathname}).`);
        }
      }
    } else {
      console.log("[Layout Redirect] DELAYING: Auth check not yet complete.");
    }
  }, [isAuthChecked, user, pathname, router, isAdminPage]); 


  const [navbarHeight, setNavbarHeight] = useState(0);

  const handleNavbarHeightChange = (height) => {
    setNavbarHeight(height);
  };

  // Jangan render Navbar di halaman login/register
  const hideNavbar = pathname === '/login' || pathname === '/register'; 
  // Sembunyikan ProfileSidebar di halaman login/register, order-success, dan admin
  const shouldShowProfileSidebar = !hideNavbar && pathname !== '/order-success' && !isAdminPage; 

  // Komponen pembantu untuk mengkonsumsi CartContext untuk ProfileSidebar
  // Didefinisikan di dalam RootLayout agar CartContext berada dalam cakupan
  function ProfileSidebarConsumer() {
    const { isProfileSidebarOpen, toggleProfileSidebar } = useContext(CartContext);
    return (
      <AnimatePresence>
        {isProfileSidebarOpen && (
          <ProfileSidebar isOpen={isProfileSidebarOpen} onClose={toggleProfileSidebar} />
        )}
      </AnimatePresence>
    );
  }

  // Tampilkan loading screen sampai autentikasi awal selesai dicek
  if (!isAuthChecked) {
    console.log("Layout: Displaying initial loading screen (waiting for auth listener setup).");
    return (
      <html lang="id">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0" />
        </head>
        <body className={`${poppins.className} bg-gray-50`}>
          <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center">
              <svg className="animate-spin h-10 w-10 text-orange-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-700 text-lg">Memuat aplikasi...</p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  console.log("Layout: Rendering children. Pathname:", pathname);
  return (
    <html lang="id" className={poppins.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0" />
      </head>
      <body className={`${poppins.className} bg-gray-50`}>
        <CartProvider>
          {/* Render Navbar hanya jika !hideNavbar. Lewatkan prop isAdminPage ke Navbar. */}
          {!hideNavbar && <Navbar onHeightChange={handleNavbarHeightChange} isAdminPage={isAdminPage} />}
          
          <main> 
            {children}
          </main>

          {/* Render ProfileSidebarConsumer di sini, sekarang ada dalam cakupan CartContext */}
          <ProfileSidebarConsumer />
        </CartProvider>
      </body>
    </html>
  );
}
