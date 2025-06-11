"use client"; // Penting untuk komponen klien di Next.js App Router

import React, { useState, useRef, useEffect } from "react";

// OrderModal Component
export default function OrderModal({ item, isOpen, onClose, onAddToCart, addToCartButtonRef }) {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const modalRef = useRef(null); // Ref untuk modal utama

  // Inisialisasi selectedOptions dan quantity saat modal dibuka atau item berubah
  // Opsi akan diinisialisasi sebagai kosong, mengharuskan pengguna untuk memilih
  useEffect(() => {
    setSelectedOptions({}); // Mulai dengan opsi kosong, mengharuskan pengguna memilih
    setQuantity(1); // Reset kuantitas setiap kali item berubah atau modal dibuka
  }, [item, isOpen]); // Dependensi pada item dan isOpen

  const handleOptionChange = (optionType, value) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionType]: value
    }));
  };

  const getCurrentPrice = () => {
    if (!item) return 0; // Pastikan item ada
    
    // Jika ada opsi 'size' dan salah satu opsi 'size' sudah terpilih
    if (item.options?.size && selectedOptions.size) {
      const sizeOption = item.options.size.find(s => s.label === selectedOptions.size);
      return sizeOption?.price || item.price || 0;
    }
    // Jika tidak ada opsi 'size' atau belum terpilih, gunakan harga dasar item
    return item.price || 0; // Pastikan ada fallback jika item.price tidak terdefinisi
  };

  const handleAddToCart = () => {
    const orderItem = {
      id: item.id,
      name: item.name,
      price: getCurrentPrice(), // Harga diambil setelah opsi ukuran dipilih
      image: item.image,
      quantity: quantity,
      selectedOptions: selectedOptions // Menggunakan selectedOptions sebagai satu objek
    };
    
    onAddToCart(orderItem);
    onClose();
    // Reset form secara implisit oleh render ulang karena `useEffect` di atas
  };

  const isValidOrder = () => {
    if (!item) return false; // Jika item tidak ada, tidak valid

    // Periksa apakah semua opsi yang ada di item.options sudah terpilih di selectedOptions
    // Ini berarti pengguna HARUS memilih setiap opsi yang tersedia agar tombol aktif
    if (item.options?.size && !selectedOptions.size) return false;
    if (item.options?.spicyLevel && !selectedOptions.spicyLevel) return false;
    if (item.options?.rasaMenu && !selectedOptions.rasaMenu) return false;
    
    return true;
  };

  // Tutup modal jika klik di luar area modal
  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) { // Hanya tambahkan listener jika modal terbuka
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]); // Dependensi pada isOpen dan onClose


  if (!isOpen || !item) return null; // Juga cek item agar tidak error jika item null/undefined

  return (
    // Backdrop overlay (tanpa motion.div)
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleClickOutside}>
      {/* Modal Content (tanpa motion.div) */}
      <div 
        ref={modalRef} // Pasang ref di sini
        className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutupnya
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Image */}
          <img 
            src={item.image} 
            alt={item.name} 
            className="w-full h-40 object-cover rounded-lg mb-4" 
            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/160x160/E0E0E0/333333?text=${item.name.replace(/\s/g, '+')}`; }}
          />

          {/* Options */}
          <div className="space-y-4">
            {/* Size Options */}
            {item.options?.size && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ukuran <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {item.options.size.map((size) => (
                    <label 
                      key={size.label} 
                      className={`flex items-center justify-between text-sm p-2 border rounded-lg cursor-pointer transition-all
                        ${selectedOptions.size === size.label ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="size"
                          value={size.label}
                          onChange={(e) => handleOptionChange('size', e.target.value)}
                          checked={selectedOptions.size === size.label}
                          className="mr-2 text-orange-500 focus:ring-orange-500"
                        />
                        <span>{size.label}</span>
                      </div>
                      <span className="font-medium text-orange-600">Rp {size.price.toLocaleString('id-ID')}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Spicy Level */}
            {item.options?.spicyLevel && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level Pedas <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {item.options.spicyLevel.map((level) => (
                    <button
                      key={level}
                      onClick={() => handleOptionChange('spicyLevel', level)}
                      className={`px-3 py-1 rounded-full border text-sm transition-all
                        ${selectedOptions.spicyLevel === level
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-orange-100'
                        }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rasa Menu */}
            {item.options?.rasaMenu && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rasa <span className="text-red-500">*</span>
                </label>
                <select
                  onChange={(e) => handleOptionChange('rasaMenu', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={selectedOptions.rasaMenu || ''} // Mengatur nilai kontrol
                >
                  <option value="" disabled>Pilih Rasa</option>
                  {item.options.rasaMenu.map((rasa) => (
                    <option key={rasa} value={rasa}>{rasa}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah</label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="text-md font-medium w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Price and Add to Cart */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-md font-medium text-gray-700">Total:</span>
              <span className="text-lg font-semibold text-orange-600">
                Rp {(getCurrentPrice() * quantity).toLocaleString('id-ID')}
              </span>
            </div>
            
            <button
              ref={addToCartButtonRef} // Add the ref here
              onClick={handleAddToCart}
              disabled={!isValidOrder()}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white text-md transition-colors ${
                isValidOrder()
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {isValidOrder() ? 'Tambah ke Keranjang' : 'Pilih opsi yang diperlukan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
