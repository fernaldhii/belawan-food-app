// app/admin/page.jsx
"use client";

import React, { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CartContext } from '../components/CartContext'; 
import { collection, query, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore'; 
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';

// Import komponen MessageBox
import MessageBox from '../components/MessageBox'; 

export default function AdminDashboardPage() {
  const { auth, user, isAuthReady, checkedAuth, db, appIdentifier } = useContext(CartContext); 
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true); 
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true); 
  const [selectedOrderId, setSelectedOrderId] = useState(null); 
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [messageBoxTitle, setMessageBoxTitle] = useState('');
  const [messageBoxContent, setMessageBoxContent] = useState('');
  const [messageBoxType, setMessageBoxType] = useState('info');
  
  // Login form states
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false); // <<< PERBAIKAN DI SINI
  const [loginError, setLoginError] = useState('');

  // State untuk konfirmasi penghapusan
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // --- Konfigurasi Email Admin yang Diizinkan ---
  const ALLOWED_ADMIN_EMAILS = ['belawanbloks@gmail.com']; 
  // ---------------------------------------------

  // Efek untuk memeriksa status autentikasi dan otorisasi admin
  useEffect(() => {
    console.log("Admin Dashboard (AUTH): useEffect triggered.");
    console.log("Admin Dashboard (AUTH): isAuthReady:", isAuthReady);
    console.log("Admin Dashboard (AUTH): checkedAuth:", checkedAuth);
    console.log("Admin Dashboard (AUTH): user:", user);
    console.log("Admin Dashboard (AUTH): user.email:", user?.email); 
    console.log("Admin Dashboard (AUTH): ALLOWED_ADMIN_EMAILS (normalized):", ALLOWED_ADMIN_EMAILS);

    if (checkedAuth) {
      console.log("Admin Dashboard (AUTH): Initial Firebase Auth check is complete.");
      
      if (user && user.email && !user.isAnonymous) {
        console.log("Admin Dashboard (AUTH): User is logged in with email:", user.email);
        const normalizedUserEmail = user.email.toLowerCase(); 
        const userIsAdmin = ALLOWED_ADMIN_EMAILS.includes(normalizedUserEmail); 
        setIsAdmin(userIsAdmin);
        console.log("Admin Dashboard (AUTH): Is this user an admin?", userIsAdmin);
        
        if (userIsAdmin) {
          setShowLoginForm(false);
          setLoadingAuth(false);
        } else {
          console.log("Admin Dashboard (AUTH): User is not an admin. Showing access denied.");
          setLoadingAuth(false);
        }
      } else {
        console.log("Admin Dashboard (AUTH): No authenticated user or anonymous user. Showing login form.");
        setShowLoginForm(true);
        setLoadingAuth(false);
      }
    } else {
      console.log("Admin Dashboard (AUTH): Waiting for checkedAuth to be true.");
      setLoadingAuth(true);
    }
  }, [checkedAuth, user, ALLOWED_ADMIN_EMAILS]); 

  // Efek untuk mengambil data pesanan dari Firestore (hanya jika admin dan data siap)
  useEffect(() => {
    if (isAdmin && db && appIdentifier && checkedAuth) { 
      console.log("Admin Dashboard (DEBUG): Setting up real-time listener for orders.");
      const ordersCollectionRef = collection(db, `artifacts/${appIdentifier}/public/data/all_orders`);
      
      // Menggunakan query tanpa orderBy untuk menghindari kebutuhan indeks tambahan
      const q = query(ordersCollectionRef); 

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Pastikan firestoreOrderId ada di data, atau fallback ke doc.id jika tidak ada
          firestoreOrderId: doc.data().firestoreOrderId || doc.id, 
          timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate().toLocaleString() : doc.data().timestamp 
        }));
        // Sortir data di frontend jika diperlukan, karena orderBy Firestore dihindari
        fetchedOrders.sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime)); 

        setOrders(fetchedOrders);
        setLoadingOrders(false);
        console.log("Admin Dashboard (DEBUG): Orders fetched:", fetchedOrders.length);
      }, (error) => {
        console.error("Admin Dashboard (ERROR): Error fetching orders:", error);
        setLoadingOrders(false);
        showCustomMessageBox("Error", `Gagal memuat pesanan: ${error.message}`, "error");
      });

      return () => {
        console.log("Admin Dashboard (DEBUG): Unsubscribed from orders listener.");
        unsubscribe();
      };
    }
  }, [isAdmin, db, appIdentifier, checkedAuth]); 

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!auth) return;
    
    setLoginLoading(true); // Menggunakan setLoginLoading yang benar
    setLoginError('');
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      console.log("Admin Login: User signed in successfully:", userCredential.user.email);
      
      const normalizedLoggedInEmail = userCredential.user.email.toLowerCase(); 
      if (ALLOWED_ADMIN_EMAILS.includes(normalizedLoggedInEmail)) { 
        setIsAdmin(true);
        setShowLoginForm(false);
        showCustomMessageBox("Sukses", "Login admin berhasil!", "success");
      } else {
        await signOut(auth);
        setLoginError('Email ini tidak memiliki akses admin.');
      }
    } catch (error) {
      console.error("Admin Login Error:", error);
      setLoginError('Login gagal. Periksa email dan password Anda.');
    } finally {
      setLoginLoading(false); // Menggunakan setLoginLoading yang benar
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    
    try {
      await signOut(auth);
      setIsAdmin(false);
      setShowLoginForm(true);
      setOrders([]);
      setLoginEmail('');
      setLoginPassword('');
      showCustomMessageBox("Info", "Anda telah logout.", "info");
    } catch (error) {
      console.error("Logout Error:", error);
      showCustomMessageBox("Error", "Gagal logout.", "error");
    }
  };

  const showCustomMessageBox = (title, content, type = 'info') => {
    setMessageBoxTitle(title);
    setMessageBoxContent(content);
    setMessageBoxType(type);
    setShowMessageBox(true);
  };

  const hideCustomMessageBox = () => {
    setShowMessageBox(false);
    setMessageBoxTitle('');
    setMessageBoxContent('');
    setMessageBoxType('info');
  };

  const GOOGLE_APPS_SCRIPT_URL = '/api/apps-script'; // URL yang sama dengan di cart/page.jsx

  const handleStatusChange = async (orderId, newStatus) => {
    // Cari pesanan yang relevan dari state 'orders' untuk mendapatkan firestoreOrderId
    const orderToUpdate = orders.find(order => order.id === orderId);
    if (!orderToUpdate) {
      showCustomMessageBox("Error", "Pesanan tidak ditemukan di daftar.", "error");
      console.error("handleStatusChange: Order not found in local state for ID:", orderId);
      return;
    }

    // Pastikan kita menggunakan firestoreOrderId yang benar untuk Google Sheet
    // Ini adalah ID yang diharapkan ada di kolom "Order ID (Firestore)" di Google Sheet
    const firestoreSheetId = orderToUpdate.firestoreOrderId; 
    
    if (!firestoreSheetId) {
        showCustomMessageBox("Error", "ID Pesanan Google Sheet tidak ditemukan untuk pesanan ini. Tidak dapat memperbarui Sheets.", "error");
        console.error("handleStatusChange: firestoreOrderId is missing for order ID:", orderId);
        return; 
    }

    console.log(`handleStatusChange: Mengubah status untuk orderId: ${orderId} (Firestore Sheet ID: ${firestoreSheetId}) menjadi ${newStatus}`);

    if (!db) {
      showCustomMessageBox("Error", "Firestore tidak tersedia.", "error");
      return;
    }
    try {
      // 1. Update status di Firestore
      const orderRef = doc(db, `artifacts/${appIdentifier}/public/data/all_orders`, orderId);
      await updateDoc(orderRef, { status: newStatus });
      console.log(`Status pesanan ${orderId} di Firestore diperbarui menjadi ${newStatus}.`);

      // 2. Kirim update ke Google Apps Script
      // Jika status baru adalah 'Cancelled', kirim perintah DELETE ke Google Sheets
      if (newStatus === 'Cancelled') {
        try {
          console.log(`handleStatusChange: Sending DELETE signal to Google Sheets for order ID: ${firestoreSheetId}`);
          const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'deleteOrder', // Menggunakan action deleteOrder
              firestoreOrderId: firestoreSheetId,
            }),
          });
          const result = await response.json();
          // Jika berhasil dihapus ATAU pesan menyatakan bahwa pesanan tidak ditemukan (berarti sudah dihapus)
          if (result.status === 'success' || (result.status === 'error' && result.message.includes('tidak ditemukan'))) { 
            showCustomMessageBox("Sukses", `Status pesanan ${orderId} berhasil dibatalkan dan dihapus dari Google Sheets.`, "success");
            console.log(`Pesanan ${orderId} berhasil dibatalkan dan dihapus dari Google Sheets (atau sudah tidak ada).`);
          } else {
            console.error("Error deleting from Google Sheet after cancellation:", result.message);
            showCustomMessageBox("Peringatan", `Pesanan dibatalkan di Firestore, tetapi gagal menghapus dari Google Sheets: ${result.message}`, "warning");
          }
        } catch (sheetsError) {
          console.error("Error sending delete signal to Google Apps Script after cancellation:", sheetsError);
          showCustomMessageBox("Peringatan", `Pesanan dibatalkan di Firestore, tetapi gagal mengirim sinyal hapus ke Google Sheets (Jaringan): ${sheetsError.message}`, "warning");
        }
      } else { // Untuk status selain 'Cancelled', kirim update status biasa
        try {
          const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            // Payload untuk Apps Script untuk update status
            body: JSON.stringify({
              action: 'updateStatus', // Tindakan yang diminta Apps Script
              firestoreOrderId: firestoreSheetId, // <--- Gunakan ID Firestore yang akan ditemukan di Sheets
              newStatus: newStatus,      // Status baru
            }),
          });

          const result = await response.json();

          if (result.status === 'success') {
            showCustomMessageBox("Sukses", `Status pesanan ${orderId} berhasil diperbarui menjadi ${newStatus} dan di Google Sheets.`, "success");
            console.log(`Status pesanan ${orderId} berhasil diperbarui di Google Sheets.`);
          } else {
            console.error("Error updating status in Google Sheet:", result.message);
            showCustomMessageBox("Peringatan", `Status di Firestore berhasil, tetapi gagal memperbarui di Google Sheets: ${result.message}`, "warning");
          }
        } catch (sheetsError) {
          console.error("Error sending status update to Google Apps Script:", sheetsError);
          showCustomMessageBox("Peringatan", `Status di Firestore berhasil, tetapi gagal mengirim update ke Google Sheets (Jaringan): ${sheetsError.message}`, "warning");
        }
      }

    } catch (error) {
      console.error("Error memperbarui status di Firestore:", error);
      showCustomMessageBox("Error", `Gagal memperbarui status: ${error.message}`, "error");
    }
  };

  // Fungsi untuk menampilkan konfirmasi delete
  const confirmDelete = (order) => {
    setOrderToDelete(order);
    setShowDeleteConfirmation(true);
  };

  // Fungsi untuk membatalkan delete
  const handleCancelDelete = () => {
    setOrderToDelete(null);
    setShowDeleteConfirmation(false);
  };

  // Fungsi untuk menghapus pesanan
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    if (!db) {
      showCustomMessageBox("Error", "Firestore tidak tersedia.", "error");
      return;
    }

    const orderId = orderToDelete.id;
    const firestoreSheetId = orderToDelete.firestoreOrderId;

    try {
      // 1. Hapus dari Firestore (koleksi public/all_orders)
      const orderRef = doc(db, `artifacts/${appIdentifier}/public/data/all_orders`, orderId);
      await deleteDoc(orderRef);
      console.log(`Pesanan ${orderId} berhasil dihapus dari Firestore.`);

      // 2. Kirim sinyal hapus ke Google Apps Script
      // Hanya coba hapus dari Sheets jika firestoreSheetId ada
      // dan tambahkan penanganan sukses jika Apps Script melaporkan 'tidak ditemukan'
      if (firestoreSheetId) {
        try {
          const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'deleteOrder', // Tindakan baru untuk Apps Script
              firestoreOrderId: firestoreSheetId, // ID untuk menemukan baris di Sheets
            }),
          });

          const result = await response.json();
          // Jika berhasil dihapus ATAU pesan menunjukkan bahwa pesanan tidak ditemukan (berarti sudah dihapus/tidak ada)
          if (result.status === 'success' || (result.status === 'error' && result.message.includes('tidak ditemukan'))) {
            showCustomMessageBox("Sukses", `Pesanan ${orderId} berhasil dihapus dari Firestore dan Google Sheets.`, "success");
            console.log(`Pesanan ${orderId} berhasil dihapus dari Firestore dan Google Sheets (atau sudah tidak ada).`);
          } else {
            console.error("Error deleting from Google Sheet:", result.message);
            showCustomMessageBox("Peringatan", `Pesanan dihapus dari Firestore, tetapi gagal menghapus dari Google Sheets: ${result.message}`, "warning");
          }
        } catch (sheetsError) {
          console.error("Error sending delete signal to Google Apps Script:", sheetsError);
          showCustomMessageBox("Peringatan", `Pesanan dihapus dari Firestore, tetapi gagal mengirim sinyal hapus ke Google Sheets (Jaringan): ${sheetsError.message}`, "warning");
        }
      } else {
        showCustomMessageBox("Sukses", `Pesanan ${orderId} berhasil dihapus dari Firestore (tidak ada ID Sheets).`, "success");
        console.warn(`Pesanan ${orderId} dihapus dari Firestore, tetapi tidak ada firestoreOrderId untuk dihapus dari Sheets.`);
      }

      setOrderToDelete(null);
      setShowDeleteConfirmation(false);
    } catch (error) {
      console.error("Error deleting order from Firestore:", error);
      showCustomMessageBox("Error", `Gagal menghapus pesanan: ${error.message}`, "error");
      setOrderToDelete(null);
      setShowDeleteConfirmation(false);
    }
  };


  const handleViewDetails = (order) => {
    setSelectedOrderId(order.id);
  };

  const handleCloseDetails = () => {
    setSelectedOrderId(null);
  };

  // Loading screen saat autentikasi belum selesai
  if (!checkedAuth || loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Memuat Dashboard Admin...</div>
      </div>
    );
  }

  // Login form untuk admin
  if (showLoginForm) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login Admin</h2>
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Email Admin
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
                disabled={loginLoading}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
                disabled={loginLoading}
              />
            </div>
            
            {loginError && (
              <div className="mb-4 text-red-600 text-sm text-center">
                {loginError}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            >
              {loginLoading ? 'Memproses...' : 'Login'}
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-orange-500 hover:text-orange-700 text-sm"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Access denied jika user login tapi bukan admin
  if (user && !user.isAnonymous && !isAdmin) {
    return (
      <div className="min-h-screen bg-red-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Akses Ditolak</h2>
          <p className="text-gray-700 mb-6">
            Email <strong>{user.email}</strong> tidak memiliki akses admin.
          </p>
          <div className="space-y-2">
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
            >
              Logout
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading pesanan
  if (loadingOrders) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Memuat Pesanan...</div>
      </div>
    );
  }

  // Dashboard utama untuk admin
  const selectedOrder = orders.find(order => order.id === selectedOrderId);

  // Komponen modal pesan (jika didefinisikan secara lokal, tidak perlu import)
  // Namun, jika Anda punya file terpisah src/components/MessageBox.jsx,
  // maka hapus definisi lokal ini dan gunakan import di atas.
  const MessageBox = ({ title, content, type, onClose }) => {
    let bgColor = 'bg-orange-500';
    let textColor = 'text-white';
    if (type === 'success') {
      bgColor = 'bg-green-500';
    } else if (type === 'error') {
      bgColor = 'bg-red-500';
    }
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
          <h3 className={`text-xl font-semibold mb-4 ${textColor} ${bgColor} p-2 rounded-md`}>{title}</h3>
          <p className="text-gray-700 mb-6">{content}</p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition"
          >
            Oke
          </button>
        </div>
      </div>
    );
  };

  return (
    // Tambahkan padding-top untuk ruang Navbar, dan sesuaikan padding horizontal
    <div className="min-h-screen bg-gray-50 pt-20 px-4 md:px-8 lg:px-12"> 
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-xl p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard Admin Pesanan</h1>
            <p className="text-sm text-gray-600 mt-2">
              Anda login sebagai: <span className="font-semibold">{user?.email}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Waktu Pesanan</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipe</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Pelanggan</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-4 text-center text-gray-500">Belum ada pesanan masuk.</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{order.orderTime}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 capitalize">{order.orderType === 'delivery' ? 'Antar' : 'Makan di Tempat'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{order.deliveryDetails.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-orange-600">Rp {order.total.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${order.status === 'Processing' ? 'bg-blue-100 text-blue-800' : ''}
                        ${order.status === 'Completed' ? 'bg-green-100 text-green-800' : ''}
                        ${order.status === 'Cancelled' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                      >
                        Lihat Detail
                      </button>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="mt-1 block w-full py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Diproses</option>
                        <option value="Completed">Selesai</option>
                        <option value="Cancelled">Dibatalkan</option>
                      </select>
                      {order.status === 'Cancelled' && ( // Tombol delete hanya muncul jika status 'Cancelled'
                        <button
                          onClick={() => confirmDelete(order)}
                          className="ml-2 p-1 text-red-600 hover:text-red-800 rounded-md hover:bg-red-100 transition" // Menambahkan padding dan hover background
                        >
                          <svg className="w-5 h-5 mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 1 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Konfirmasi Hapus */}
      <AnimatePresence> 
        {showDeleteConfirmation && (
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
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Konfirmasi Penghapusan Pesanan</h3>
              <p className="text-gray-600 mb-6">Anda yakin ingin menghapus pesanan ini (ID: {orderToDelete?.id.substring(0, 8)}...)? Tindakan ini tidak dapat dibatalkan.</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleCancelDelete}
                  className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteOrder}
                  className="px-5 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Detail Pesanan */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Detail Pesanan {selectedOrder.id.substring(0, 8)}...</h3>
            <p className="text-sm text-gray-600 mb-2"><strong>Waktu:</strong> {selectedOrder.orderTime}</p>
            <p className="text-sm text-gray-600 mb-2"><strong>Tipe:</strong> {selectedOrder.orderType === 'delivery' ? 'Antar' : 'Makan di Tempat'}</p>
            <p className="text-sm text-gray-600 mb-2"><strong>Nama Pelanggan:</strong> {selectedOrder.deliveryDetails.name}</p>
            {selectedOrder.orderType === 'delivery' && (
              <>
                <p className="text-sm text-gray-600 mb-2"><strong>Alamat:</strong> {selectedOrder.deliveryDetails.address}</p>
                <p className="text-sm text-gray-600 mb-2"><strong>Telepon:</strong> {selectedOrder.deliveryDetails.phone}</p>
              </>
            )}
            {selectedOrder.deliveryDetails.notes && (
              <p className="text-sm text-gray-600 mb-2"><strong>Catatan:</strong> {selectedOrder.deliveryDetails.notes}</p>
            )}
            <p className="text-sm text-gray-600 mb-4"><strong>Status:</strong> <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${selectedOrder.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${selectedOrder.status === 'Processing' ? 'bg-blue-100 text-blue-800' : ''}
                        ${selectedOrder.status === 'Completed' ? 'bg-green-100 text-green-800' : ''}
                        ${selectedOrder.status === 'Cancelled' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {selectedOrder.status}
                      </span>
            </p>

            <h4 className="text-lg font-semibold text-gray-700 mb-2">Item:</h4>
            <ul className="list-disc list-inside mb-4 max-h-48 overflow-y-auto border p-2 rounded-md bg-gray-50">
              {selectedOrder.items.map((item, index) => (
                <li key={index} className="text-sm text-gray-700 mb-1">
                  {item.name} 
                  {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && 
                    ` (${Object.values(item.selectedOptions).join(', ')})`
                  } x {item.quantity} = Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                </li>
              ))}
            </ul>
            <p className="text-lg font-bold text-orange-600 text-right">Total: Rp {selectedOrder.total.toLocaleString('id-ID')}</p>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleCloseDetails}
                className="px-5 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Message Box */}
      {showMessageBox && (
        <MessageBox
          title={messageBoxTitle}
          content={messageBoxContent}
          type={messageBoxType}
          onClose={hideCustomMessageBox}
        />
      )}
    </div>
  );
}
