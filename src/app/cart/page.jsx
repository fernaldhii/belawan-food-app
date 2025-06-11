// app/cart/page.jsx
"use client";

import React, { useContext, useState, useEffect } from 'react';
import { CartContext } from '../components/CartContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Import tambahan untuk Firestore
import { collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore'; // Pastikan updateDoc diimport

// Import komponen MessageBox (pastikan path ini benar)
import MessageBox from '../components/MessageBox';

export default function CartPage() {
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    getTotalPrice, 
    clearCart,
    db, // Firestore instance
    auth, // Auth instance
    userId,
    isAuthReady,
    appIdentifier
  } = useContext(CartContext);

  const router = useRouter();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);

  const [deliveryDetails, setDeliveryDetails] = useState({
    name: '',
    address: '',
    phone: '',
    notes: ''
  });

  const [showMessageBox, setShowMessageBox] = useState(false);
  const [messageBoxTitle, setMessageBoxTitle] = useState('');
  const [messageBoxContent, setMessageBoxContent] = useState(''); 
  const [messageBoxType, setMessageBoxType] = useState('info');

  // State untuk melacak apakah pengguna anonim
  const [isCurrentUserAnonymous, setIsCurrentUserAnonymous] = useState(false);

  // State untuk opsi pengiriman
  const [deliveryOption, setDeliveryOption] = useState('delivery'); // Default ke 'delivery'

  // URL Google Apps Script yang sudah di-deploy sebagai Web App
  const GOOGLE_APPS_SCRIPT_URL = '/api/apps-script'; // Menggunakan proxy path

  useEffect(() => {
    if (isAuthReady && auth && auth.currentUser) {
      setIsCurrentUserAnonymous(auth.currentUser.isAnonymous);
      console.log("CartPage: Current user is anonymous:", auth.currentUser.isAnonymous);
    } else if (isAuthReady && !auth?.currentUser) {
      setIsCurrentUserAnonymous(true); 
      console.log("CartPage: No current user, treating as anonymous for UI.");
    }
  }, [isAuthReady, auth]); 

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeliveryDetails(prevDetails => ({
      ...prevDetails,
      [name]: value
    }));
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
    
    if (messageBoxType === 'success') {
      if (isCurrentUserAnonymous) {
        console.log("Anonymous user: Redirecting to home page.");
        router.push('/'); 
      } else {
        console.log("Non-anonymous user: Redirecting to order success page.");
        router.push('/order-success?from=cart'); 
      }
    }
    setMessageBoxType('info');
  };

  const confirmRemove = (item) => {
    setItemToRemove(item);
    setShowConfirmation(true);
  };

  const handleRemoveConfirmed = () => {
    if (itemToRemove) {
      removeFromCart(itemToRemove.cartId);
      setItemToRemove(null);
    }
    setShowConfirmation(false);
  };

  const handleRemoveCancelled = () => {
    setItemToRemove(null);
    setShowConfirmation(false);
  };

  const handleCheckout = async () => {
    if (!db) {
      showCustomMessageBox("Error Aplikasi", "Layanan Firestore tidak tersedia. Mohon coba lagi nanti.", "error");
      console.error("Firestore DB instance is not available from CartContext.");
      return;
    }
    if (!userId || !isAuthReady) {
      showCustomMessageBox("Autentikasi Diperlukan", "Pengguna belum diautentikasi. Mohon tunggu sebentar atau muat ulang halaman.", "error");
      console.error("User ID or Auth not ready from CartContext. userId:", userId, "isAuthReady:", isAuthReady);
      return;
    }

    if (cart.length === 0) {
      showCustomMessageBox("Keranjang Kosong", "Keranjang Anda kosong. Tambahkan item ke keranjang sebelum memesan.", "info");
      return;
    }

    let whatsappMessage = "";
    let whatsappUrl = "";
    const whatsappPhoneNumber = "6287834968097"; // Nomor WhatsApp penjual

    // Data dasar pesanan untuk Firestore dan Google Sheets
    const itemsToSave = cart.map(item => {
        return {
          id: item.id || null,
          name: item.name || 'Unknown Item',
          quantity: item.quantity || 1,
          price: item.price || 0,
          selectedOptions: item.selectedOptions && Object.keys(item.selectedOptions).length > 0 ? item.selectedOptions : {},
          image: item.image || null,
        };
    });

    let currentDeliveryDetails = { ...deliveryDetails }; // Buat salinan

    if (deliveryOption === 'delivery') {
      // Validasi untuk opsi 'Antar'
      if (!currentDeliveryDetails.name || !currentDeliveryDetails.address || !currentDeliveryDetails.phone) {
        showCustomMessageBox("Detail Pengiriman Belum Lengkap", "Mohon lengkapi detail pengiriman (Nama, Alamat, Telepon) sebelum memesan.", "error");
        return;
      }
      
      whatsappMessage = "Halo, saya ingin memesan makanan:\n\n";
      whatsappMessage += "Daftar Pesanan:\n";
      cart.forEach(item => {
        let optionsText = '';
        const safeSelectedOptions = item.selectedOptions || {};
        if (Object.keys(safeSelectedOptions).length > 0) {
          optionsText = ` (${Object.entries(safeSelectedOptions)
            .map(([key, value]) => `${value}`)
            .join(', ')})`;
        }
        // Format untuk WhatsApp:
        whatsappMessage += `- ${item.name}${optionsText} x ${item.quantity} = Rp ${(item.price * item.quantity).toLocaleString('id-ID')}\n`;
      });
      whatsappMessage += "---------------------------\n";
      whatsappMessage += `Total: Rp ${getTotalPrice().toLocaleString('id-ID')}\n\n`;
      whatsappMessage += "Detail Pengiriman:\n";
      whatsappMessage += `Nama: ${currentDeliveryDetails.name}\n`;
      whatsappMessage += `Alamat: ${currentDeliveryDetails.address}\n`;
      whatsappMessage += `Telepon: ${currentDeliveryDetails.phone}\n`;
      if (currentDeliveryDetails.notes) {
        whatsappMessage += `Catatan: ${currentDeliveryDetails.notes}\n`;
      }
      whatsappMessage += "\nTerima kasih!";

      const encodedMessage = encodeURIComponent(whatsappMessage);
      whatsappUrl = `https://wa.me/${whatsappPhoneNumber}?text=${encodedMessage}`;
      
      // Buka WhatsApp hanya untuk opsi 'Antar'
      window.open(whatsappUrl, '_blank');

    } else { // deliveryOption === 'dineIn' (Makan di Tempat)
        // Validasi minimal untuk opsi 'Makan di Tempat'
        if (!currentDeliveryDetails.name) {
          showCustomMessageBox("Detail Pemesan Belum Lengkap", "Mohon masukkan Nama Lengkap Anda untuk pesanan Makan di Tempat.", "error");
          return;
        }
        // Atur detail pengiriman khusus untuk dine-in agar tersimpan di Firestore/Sheets
        currentDeliveryDetails = {
            name: currentDeliveryDetails.name || 'Makan di Tempat (Pelanggan)', 
            address: 'Makan di Tempat',
            phone: 'Tidak Ada (Makan di Tempat)', 
            notes: currentDeliveryDetails.notes || '',
        };
        // Tidak ada pesan WhatsApp yang dibuat atau dibuka untuk 'Makan di Tempat'
    }

    // --- Data pesanan umum untuk Firestore (akan disimpan di dua lokasi) ---
    const baseOrderData = {
      items: itemsToSave,
      total: getTotalPrice(),
      deliveryDetails: currentDeliveryDetails, 
      orderTime: new Date().toLocaleString(),
      timestamp: serverTimestamp(),
      userId: userId, // Ini adalah userId pelanggan yang membuat pesanan
      userType: isCurrentUserAnonymous ? "anonymous" : "authenticated", 
      orderType: deliveryOption, // 'delivery' atau 'dineIn'
      status: 'Pending' // Status awal pesanan untuk dashboard admin
    };

    let firestoreUserSuccess = false;
    let firestoreAllOrdersSuccess = false;
    let sheetsSuccess = false; 
    let userOrderDocId = null; // ID dokumen untuk koleksi per pengguna
    let publicOrderDocId = null; // ID dokumen untuk koleksi public/all_orders

    // 1. Kirim ke Firestore (koleksi per pengguna, untuk riwayat pesanan pelanggan)
    try {
      const userOrdersCollectionRef = collection(db, `artifacts/${appIdentifier}/users/${userId}/orders`);
      const docRef = await addDoc(userOrdersCollectionRef, baseOrderData);
      userOrderDocId = docRef.id; 
      console.log("Order saved to Firestore (per user) successfully with ID:", userOrderDocId);
      firestoreUserSuccess = true;
    } catch (e) {
      console.error("Error adding document to Firestore (per user):", e);
      showCustomMessageBox("Gagal Menyimpan Pesanan (Firestore)", `Terjadi kesalahan saat menyimpan riwayat pesanan Anda: ${e.message}. Silakan coba lagi.`, "error");
    }

    // 2. Kirim ke Firestore (koleksi umum, untuk dashboard admin)
    // PENTING: firestoreOrderId yang kita kirim ke Google Sheets dan yang di-track oleh admin
    // dashboard HARUSLAH ID dari dokumen di koleksi 'all_orders' itu sendiri.
    try {
        const allOrdersCollectionRef = collection(db, `artifacts/${appIdentifier}/public/data/all_orders`);
        // Tambahkan dokumen awal ke koleksi all_orders
        const publicDocRef = await addDoc(allOrdersCollectionRef, { 
            ...baseOrderData, 
            userOrderDocId: userOrderDocId // Menyimpan referensi ID dari koleksi per pengguna (opsional, tapi bagus untuk traceability)
        });
        publicOrderDocId = publicDocRef.id; // Dapatkan ID dokumen yang baru dibuat di all_orders
        
        // Setelah mendapatkan publicOrderDocId, Lakukan update pada dokumen yang sama 
        // untuk menambahkan field 'firestoreOrderId' dengan nilai publicOrderDocId.
        // Ini memastikan field 'firestoreOrderId' di dalam dokumen all_orders berisi ID uniknya sendiri.
        // Ini adalah kunci agar Apps Script dapat menemukan dan memperbarui/menghapus baris yang benar.
        await updateDoc(publicDocRef, { firestoreOrderId: publicOrderDocId });


        console.log("Order saved to Firestore (all_orders) successfully with ID:", publicOrderDocId);
        firestoreAllOrdersSuccess = true;
    } catch (e) {
        console.error("Error adding document to Firestore (all_orders):", e);
        if (firestoreUserSuccess) {
             console.warn("Order saved to user's history but failed to save to all_orders collection for admin. Admin may not see this order.");
        } else {
             showCustomMessageBox("Gagal Menyimpan Pesanan (Firestore Admin)", `Terjadi kesalahan saat menyimpan pesanan untuk admin: ${e.message}.`, "error");
        }
    }

    // DEBUG: Log the publicOrderDocId right before sending to Apps Script
    console.log("Firestore Order ID to be sent to Google Sheets (from public collection):", publicOrderDocId); 

    // 3. Kirim ke Google Apps Script (Google Sheets)
    const orderDataGoogleSheet = {
      orderTime: new Date().toLocaleString(),
      firestoreOrderId: publicOrderDocId, // <--- Gunakan ID dari dokumen di koleksi 'all_orders'
      userId: userId || 'anonymous',
      userType: isCurrentUserAnonymous ? "anonymous" : "authenticated",
      orderType: deliveryOption,
      items: itemsToSave.map(item => { 
        const optionsText = item.selectedOptions && Object.keys(item.selectedOptions).length > 0 
          ? ' (' + Object.values(item.selectedOptions).join(', ') + ')' 
          : '';
        
        const cleanFormattedNameForSheets = `${item.name}${optionsText} x ${item.quantity}`; 
        
        console.log(`[DEBUG] formattedName for item '${item.name}' (sent to Sheets):`, cleanFormattedNameForSheets);

        return {
          name: item.name,
          quantity: item.quantity,
          formattedName: cleanFormattedNameForSheets, 
          price: item.price,
        };
      }),
      total: getTotalPrice(),
      deliveryDetails: currentDeliveryDetails,
      notes: currentDeliveryDetails.notes || '',
      status: baseOrderData.status 
    };

    console.log("Order Data being sent to Google Sheet (FINAL PAYLOAD):", JSON.stringify(orderDataGoogleSheet, null, 2)); 

    try {
      console.log("Attempting to send order to Google Sheets...");
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderDataGoogleSheet),
      });

      const result = await response.json();

      if (result.status === 'success') {
        console.log("Order saved to Google Sheet successfully!");
        sheetsSuccess = true;
      } else {
        console.error("Error saving order to Google Sheet:", result.message);
        showCustomMessageBox("Gagal Menyimpan Pesanan (Google Sheets)", `Terjadi kesalahan saat menyimpan pesanan Anda ke Google Sheets: ${result.message}. Silakan hubungi penjual.`, "error");
      }
    } catch (e) {
      console.error("Error sending order to Google Apps Script:", e);
      showCustomMessageBox("Gagal Menyimpan Pesanan (Jaringan)", `Terjadi kesalahan jaringan saat mengirim pesanan ke Google Sheets: ${e.message}.`, "error");
    }
    
    console.log("sheetsSuccess before final check:", sheetsSuccess); 

    if (firestoreUserSuccess || sheetsSuccess) { 
      clearCart();
      setDeliveryDetails({
        name: '',
        address: '',
        phone: '',
        notes: ''
      });

      let successMessageContent = "Pesanan Anda telah berhasil dibuat."; 
      if (deliveryOption === 'delivery') {
          successMessageContent += " Silakan konfirmasi detail pesanan di aplikasi WhatsApp untuk menyelesaikan pemesanan Anda.";
      } else { 
          successMessageContent += " Silakan datang ke tempat kami untuk pengambilan pesanan Anda. Pesanan Anda akan segera disiapkan.";
      }
      if (isCurrentUserAnonymous) {
          successMessageContent += " Anda dapat mendaftar untuk melihat riwayat pesanan Anda.";
      }

      showCustomMessageBox(
        "Pesanan Berhasil!",
        successMessageContent,
        "success"
      );
    } else {
        console.warn("Both Firestore (user) and Google Sheets failed to save the order. Firestore (all_orders) status:", firestoreAllOrdersSuccess);
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
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

  return (
    <div className="min-h-screen bg-gray-50 pt-10 mt-12 pb-20 px-4 md:px-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center relative mb-6">
          <div className="absolute left-0">
            <Link href="/menu" className="flex items-center text-gray-600 hover:text-gray-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span className="hidden sm:inline">Kembali</span>
            </Link>
          </div>
          
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800">Keranjang Anda</h1>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 text-lg mb-6">Keranjang Anda kosong. Mari isi dengan hidangan lezat!</p>
            <button
              onClick={() => router.push('/menu')}
              className="px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition text-md font-semibold"
            >
              Lihat Menu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-6">Daftar Pesanan</h2>
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div
                    key={item.cartId}
                    layout
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={itemVariants}
                    className="flex items-center border-b border-gray-200 py-4 last:border-b-0"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg mr-4"
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/80x80/E0E0E0/333333?text=${item.name.replace(/\s/g, '+')}`; }}
                    />
                    <div className="flex-grow">
                      <h3 className="text-sm md:text-lg font-semibold text-gray-800">{item.name}</h3>
                      {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                        <p className="text-gray-500 text-xs">
                          {Object.entries(item.selectedOptions)
                            .map(([key, value]) => `${value}`)
                            .join(', ')}
                        </p>
                      )}
                      <p className="text-orange-600 text-md font-semibold">Rp {item.price.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                        className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition"
                        disabled={item.quantity <= 1}
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4"></path></svg>
                      </button>
                      <span className="text-base font-medium text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                        className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition"
                        disabled={item.quantity >= 99}
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"></path></svg>
                      </button>
                      <button
                        onClick={() => confirmRemove(item)}
                        className="p-2 text-red-500 hover:text-red-700 transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 1 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Pilih Tipe Pesanan</h2>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => setDeliveryOption('delivery')}
                    className={`flex-1 py-2 text-center text-sm font-medium transition-colors duration-200 
                                ${deliveryOption === 'delivery' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Antar
                  </button>
                  <button
                    onClick={() => setDeliveryOption('dineIn')}
                    className={`flex-1 py-2 text-center text-sm font-medium transition-colors duration-200 
                                ${deliveryOption === 'dineIn' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Makan di Tempat
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Ringkasan Pesanan</h2>
                <div className="flex justify-between text-md font-medium text-gray-700 mb-2">
                  <span>Subtotal:</span>
                  <span>Rp {getTotalPrice().toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-md font-medium text-gray-700 mb-4">
                  <span>Biaya Pengiriman:</span>
                  <span>Rp 0</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-orange-500 border-t border-gray-200 pt-4">
                  <span>Total:</span>
                  <span>Rp {getTotalPrice().toLocaleString('id-ID')}</span>
                </div>

                {deliveryOption === 'delivery' && (
                  <div className="mt-6 bg-orange-100 border-l-4 border-orange-500 text-orange-800 p-4 rounded-lg text-xs">
                    <p className="font-semibold mb-1">Catatan Penting:</p>
                    <p>Pengiriman diatur oleh pelanggan (GoSend/Kurir lainnya) dari lokasi kami setelah pesanan dikonfirmasi penjual.</p>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={
                    !isAuthReady || cart.length === 0 ||
                    (deliveryOption === 'delivery' && (!deliveryDetails.name || !deliveryDetails.address || !deliveryDetails.phone)) ||
                    (deliveryOption === 'dineIn' && !deliveryDetails.name) 
                  }
                  className={`w-full mt-6 px-6 py-3 rounded-lg font-semibold transition text-md ${
                    (isAuthReady && cart.length > 0 && 
                     (deliveryOption === 'dineIn' && deliveryDetails.name) || 
                     (deliveryOption === 'delivery' && deliveryDetails.name && deliveryDetails.address && deliveryDetails.phone)) 
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {deliveryOption === 'delivery' ? 'Pesan Sekarang via WhatsApp' : 'Pesan Sekarang'}
                </button>
              </div>

              {deliveryOption === 'delivery' && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Detail Pengiriman</h2>
                  <form className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={deliveryDetails.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-gray-100"
                        placeholder="Masukkan nama lengkap Anda"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Alamat Pengiriman</label>
                      <textarea
                        id="address"
                        name="address"
                        value={deliveryDetails.address}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-gray-100"
                        placeholder="Jalan, Nomor Rumah, RT/RW, Kelurahan, Kecamatan, Kota"
                        required
                      ></textarea>
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={deliveryDetails.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-gray-100"
                        placeholder="Contoh: 081234567890"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={deliveryDetails.notes}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-4 py-2 text-sm md:text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-gray-100"
                        placeholder="Contoh: Jangan terlalu pedas, antar ke pintu belakang"
                      ></textarea>
                    </div>
                  </form>
                </div>
              )}
              {deliveryOption === 'dineIn' && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Detail Pemesan</h2>
                  <form className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={deliveryDetails.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-gray-100"
                        placeholder="Masukkan nama lengkap Anda"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={deliveryDetails.notes}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-4 py-2 text-sm md:text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-gray-100"
                        placeholder="Contoh: Pesanan atas nama ini"
                      ></textarea>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
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
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Konfirmasi Penghapusan</h3>
              <p className="text-gray-600 mb-6">Anda yakin ingin menghapus "{itemToRemove?.name}" dari keranjang?</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleRemoveCancelled}
                  className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleRemoveConfirmed}
                  className="px-5 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Message Box */}
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
