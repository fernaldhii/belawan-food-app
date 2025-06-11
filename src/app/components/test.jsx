"use client";

import { useState } from "react";
import { useCart } from "./CartContext"; // Pastikan path sesuai dengan struktur folder Anda

const menuItems = [
  // Cumi/Udang
  { id: 1, name: "Cumi Asam Manis", category: "Cumi/Udang", image: "/images/cumi.jpg",
    options: {
      spicyLevel: ["Biasa", "Pedas"],
      size: [
        { label: "Kecil", price: "Rp. 35.000"},
        { label: "Besar", price: "Rp. 40.000"}
      ]
    }
  },
  { id: 2, name: "Cumi Saus Padang", category: "Cumi/Udang", image: "/images/cumi.jpg",
    options: {
      spicyLevel: ["Biasa", "Pedas"],
      size: [
        { label: "Kecil", price: "Rp. 35.000"},
        { label: "Besar", price: "Rp. 40.000"}
      ]
    }
  },
  { id: 3, name: "Cumi Saus Tiram", category: "Cumi/Udang", image: "/images/cumi.jpg",
    options: {
      spicyLevel: ["Biasa", "Pedas"],
      size: [
        { label: "Kecil", price: "Rp. 35.000"},
        { label: "Besar", price: "Rp. 40.000"}
      ]
    }
  },
  { id: 4, name: "Cumi Goreng Tepung", category: "Cumi/Udang", image: "/images/cumi.jpg",
    options: {
      size: [
        { label: "Kecil", price: "Rp. 35.000"},
        { label: "Besar", price: "Rp. 40.000"}
      ]
    }
  },
  { id: 5, name: "Cumi Kremes", category: "Cumi/Udang", image: "/images/cumi.jpg",
    options: {
      size: [
        { label: "Kecil", price: "Rp. 35.000"},
        { label: "Besar", price: "Rp. 40.000"}
      ]
    }
  },
  { id: 6, name: "Cumi Saus Mentega", category: "Cumi/Udang", image: "/images/cumi.jpg",
    options: {
      size: [
        { label: "Kecil", price: "Rp. 35.000"},
        { label: "Besar", price: "Rp. 40.000"}
      ]
    }
  },
  { id: 7, name: "Cumi Sambal Pete", category: "Cumi/Udang", image: "/images/cumi.jpg",
    options: {
      spicyLevel: ["Pedas", "Sangat Pedas"],
      size: [
        { label: "Kecil", price: "Rp. 35.000"},
        { label: "Besar", price: "Rp. 40.000"}
      ]
    }
  },
  { id: 8, name: "Cumi Tauco", category: "Cumi/Udang", image: "/images/cumi.jpg",
    options: {
      spicyLevel: ["Pedas", "Sangat Pedas"],
      size: [
        { label: "Kecil", price: "Rp. 35.000"},
        { label: "Besar", price: "Rp. 40.000"}
      ]
    }
  },
  { id: 9, name: "Udang Rebus", category: "Cumi/Udang", image: "/images/cumi.jpg",
    options: {
      size: [
        { label: "Kecil", price: "Rp. 35.000"},
        { label: "Besar", price: "Rp. 40.000"}
      ]
    }
  },

  // Ikan
  { id: 10, name: "Ikan Bawal", category: "Ikan", image: "/images/ikan-bawal.jpg",
    options: {
      spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 35.000"
  },
  { id: 11, name: "Ikan Kerapu", category: "Ikan", image: "/images/ikan-kerapu.jpg",
    options: {
      spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 38.000"
  },
  { id: 12, name: "Ikan Kwe", category: "Ikan", image: "/images/ikan-kwe.jpg",
    options: {
      spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 38.000"
  },
  { id: 13, name: "Ikan Gurame", category: "Ikan", image: "/images/ikan-gurame.jpg",
    options: {
      spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 45.000"
  },
  { id: 14, name: "Ikan Nila", category: "Ikan", image: "/images/ikan-nila.jpg",
    options: {
      spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 25.000"
  },
 
  //Kepiting
  { id: 15, name: "Kepiting", category: "Cumi/Udang", image: "/images/cumi.jpg",
    options: {
      spicyLevel: ["Biasa", "Pedas"],
      rasaMenu: ["Lada Hitam", "Asam Manis", "Saus Padang", "Saus Tiram"],
    },
    price: "Rp. 50.000"
  },

  //Kerang
  { id: 16, name: "Kerang", category: "Kerang", image: "/images/kerang.jpg",
    options: {
      spicyLevel: ["Biasa", "Pedas"],
      rasaMenu: ["Lada Hitam", "Asam Manis", "Saus Padang", "Saus Tiram", "Mentega"],
    },
    price: "Rp. 25.000"
  },
  { id: 17, name: "Kerang Rebus", category: "Kerang", image: "/images/kerang-rebus.jpg",
    options: {
    },
    price: "Rp. 20.000"
  },
  { id: 18, name: "Kerang Hijau Goreng", category: "Kerang", image: "/images/kerang-hijau.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 20.000"
  },

  // Sayuran
  { id: 19, name: "Capcai Goreng", category: "Sayuran", image: "/images/capcai-goreng.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 23.000"
  },
  { id: 20, name: "Capcai Rebus", category: "Sayuran", image: "/images/capcai-rebus.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 23.000"
  },
  { id: 21, name: "Nasi Capcai", category: "Sayuran", image: "/images/nasi-capcai.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 25.000"
  },
  { id: 22, name: "Nasi Sapo", category: "Sayuran", image: "/images/nasi-sapo.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 31.000"
  },
  { id: 23, name: "Safo Tahu Hotplate", category: "Sayuran", image: "/images/safo-tahu.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 28.000"
  },
  { id: 24, name: "Safo Tahu Ori Belawan", category: "Sayuran", image: "/images/safo-tahu.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 28.000"
  },
  { id: 25, name: "Safo Tahu Masak Pedas", category: "Sayuran", image: "/images/safo-tahu.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 28.000"
  },
  { id: 26, name: "Fuyunghai", category: "Sayuran", image: "/images/fuyunghai.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 22.000"
  },
  { id: 27, name: "Toge Ikan Asin", category: "Sayuran", image: "/images/toge-ikan.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 20.000"
  },
  { id: 28, name: "Kangkung Tumis Belacan", category: "Sayuran", image: "/images/kangkung-tumis.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 15.000"
  },
  { id: 29, name: "Kangkung Tumis", category: "Sayuran", image: "/images/kangkung-tumis.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 20.000"
  },
  { id: 30, name: "Kangkung Tumis Hotplate", category: "Sayuran", image: "/images/kangkung-hotplate.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 20.000"
  },

  // Tongseng
  { id: 31, name: "Tongseng Kambing", category: "Tongseng", image: "/images/tongseng-kambing.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 25.000"
  },
  { id: 32, name: "Tongseng Sapi", category: "Tongseng", image: "/images/tongseng-sapi.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 21.000"
  },
  { id: 33, name: "Tongseng Ayam", category: "Tongseng", image: "/images/tongseng-ayam.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 21.000"
  },

  // Mie
  { id: 34, name: "Mie Goreng", category: "Mie", image: "/images/mie-goreng.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 28.000"
  },
  { id: 35, name: "Mie Rebus", category: "Mie", image: "/images/mie-rebus.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 28.000"
  },
  { id: 36, name: "Kwetiaw Goreng", category: "Mie", image: "/images/kwetiaw-goreng.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 28.000"
  },
  { id: 37, name: "Kwetiaw Rebus", category: "Mie", image: "/images/kwetiaw-rebus.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 28.000"
  },
  { id: 38, name: "Bihun Goreng", category: "Mie", image: "/images/bihun-goreng.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 28.000"
  },
  { id: 39, name: "Bihun Rebus", category: "Mie", image: "/images/bihun-rebus.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 28.000"
  },
  { id: 40, name: "Ifumie Belawan", category: "Mie", image: "/images/ifumie-belawan.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 30.000"
  },
  { id: 41, name: "Spagety", category: "Mie", image: "/images/spagety.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 30.000"
  },

  // Ayam
  { id: 42, name: "Ayam Mentega", category: "Ayam", image: "/images/ayam-mentega.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
          size: [
          { label: "Kecil", price: "Rp. 27.000"},
          { label: "Besar", price: "Rp. 30.000"}
        ]
    }
  },
  { id: 43, name: "Ayam Rica-Rica", category: "Ayam", image: "/images/ayam-rica.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
          size: [
          { label: "Kecil", price: "Rp. 27.000"},
          { label: "Besar", price: "Rp. 30.000"}
        ]
    }
  },
  { id: 44, name: "Ayam Woku", category: "Ayam", image: "/images/ayam-woku.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
          size: [
          { label: "Kecil", price: "Rp. 27.000"},
          { label: "Besar", price: "Rp. 30.000"}
        ]
    }
  },
  { id: 45, name: "Ayam Kuluyuk", category: "Ayam", image: "/images/ayam-kuluyuk.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
          size: [
          { label: "Kecil", price: "Rp. 27.000"},
          { label: "Besar", price: "Rp. 30.000"}
        ]
    }
  },
  { id: 46, name: "Ayam Cah Jamur", category: "Ayam", image: "/images/ayam-cahjamur.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
          size: [
          { label: "Kecil", price: "Rp. 27.000"},
          { label: "Besar", price: "Rp. 30.000"}
        ]
    }
  },
  { id: 47, name: "Ayam Lada Hitam", category: "Ayam", image: "/images/ayam-ladahitam.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
          size: [
          { label: "Kecil", price: "Rp. 27.000"},
          { label: "Besar", price: "Rp. 30.000"}
        ]
    }
  },
  { id: 48, name: "Ayam Bistik", category: "Ayam", image: "/images/ayam-bistik.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
          size: [
          { label: "Kecil", price: "Rp. 30.000"},
          { label: "Besar", price: "Rp. 35.000"}
        ]
    }
  },
  { id: 49, name: "Chicken Katsu", category: "Ayam", image: "/images/chicken-katsu.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
          size: [
          { label: "Kecil", price: "Rp. 30.000"},
          { label: "Besar", price: "Rp. 35.000"}
        ]
    }
  },
  { id: 50, name: "Fried Chicken Belawan", category: "Ayam", image: "/images/fried-chicken.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
          size: [
          { label: "Kecil", price: "Rp. 30.000"},
          { label: "Besar", price: "Rp. 35.000"}
        ]
    }
  },
  { id: 51, name: "Ayam", category: "Ayam", image: "/images/ayam.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 20.000"
  },

  // Empek-empek
  { id: 52, name: "Empek-Empek Kapal Selam", category: "Empek-empek", image: "/images/empek-kapalselam.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 17.000"
  },
  { id: 53, name: "Empek-Empek Lenjer", category: "Empek-empek", image: "/images/empek-lenjer.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 10.000"
  },
  { id: 54, name: "Empek-Empek Adaan", category: "Empek-empek", image: "/images/empek-adaan.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 8.000"
  },
  { id: 55, name: "Empek-Empek Tahu", category: "Empek-empek", image: "/images/empek-tahu.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 12.000"
  },
  { id: 56, name: "Empek-Empek Kulit", category: "Empek-empek", image: "/images/empek-kulit.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 10.000"
  },
  { id: 57, name: "Pempek Lenggang", category: "Empek-empek", image: "/images/pempek-lenggang.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 15.000"
  },
  { id: 58, name: "Tekwan", category: "Empek-empek", image: "/images/tekwan.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 15.000"
  },

  // Bebek
  { id: 59, name: "Bebek Lada Hitam", category: "Bebek", image: "/images/bebek.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
          size: [
          { label: "Kecil", price: "Rp. 35.000"},
          { label: "Besar", price: "Rp. 40.000"}
        ]
    }
  },

  // Soup
  { id: 60, name: "Soup Iga Sapi", category: "Soup", image: "/images/soup-iga.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 28.000"
  },
  { id: 61, name: "Sop Iga bakar", category: "Soup", image: "/images/soup-iga.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 35.000"
  },
  { id: 62, name: "Sop Buntut", category: "Soup", image: "/images/soup-buntut.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 42.000"
  },

  // Nasi Goreng
  { id: 63, name: "Nasi Goreng Ayam", category: "Nasi Goreng", image: "/images/nasi-goreng.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 23.000"
  },
  { id: 64, name: "Nasi Goreng Pete", category: "Nasi Goreng", image: "/images/nasi-goreng.jpg",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: "Rp. 23.000"
  },

  // Lain-lain
  { id: 65, name: "Nasi Putih", category: "Lain-lain", image: "/images/nasi-putih.jpg",
    options: {
    },
    price: "Rp. 5.000"
  },
  { id: 66, name: "Nasi Uduk", category: "Lain-lain", image: "/images/nasi-uduk.jpg",
    options: {
    },
    price: "Rp. 6.000"
  },
  { id: 68, name: "Tahu/Tempe Goreng", category: "Lain-lain", image: "/images/tahu-tempe.jpg",
    options: {
    },
    price: "Rp. 5.000"
  },
  { id: 69, name: "Sambal Hijau", category: "Lain-lain", image: "/images/sambal-hijau.jpg",
    options: {
    },
    price: "Rp. 5.000"
  },
];

const categories = [
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

// Modal Component untuk Options
function OrderModal({ item, isOpen, onClose, onAddToCart }) {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);

  const handleOptionChange = (optionType, value) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionType]: value
    }));
  };

  const getCurrentPrice = () => {
    if (item.options?.size && selectedOptions.size) {
      const sizeOption = item.options.size.find(s => s.label === selectedOptions.size);
      return sizeOption?.price || item.price;
    }
    return item.price;
  };

  const handleAddToCart = () => {
    const orderItem = {
      id: item.id,
      name: item.name,
      price: getCurrentPrice(),
      image: item.image,
      quantity: quantity,
      ...selectedOptions
    };
    
    onAddToCart(orderItem);
    onClose();
    // Reset form
    setSelectedOptions({});
    setQuantity(1);
  };

  const isValidOrder = () => {
    // Check if all required options are selected
    if (item.options?.size && !selectedOptions.size) return false;
    if (item.options?.spicyLevel && !selectedOptions.spicyLevel) return false;
    if (item.options?.rasaMenu && !selectedOptions.rasaMenu) return false;
    return true;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
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
          <img src={item.image} alt={item.name} className="w-full h-40 object-cover rounded-lg mb-4" />

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
                    <label key={size.label} className="flex items-center justify-between p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="size"
                          value={size.label}
                          onChange={(e) => handleOptionChange('size', e.target.value)}
                          className="mr-2"
                        />
                        <span>{size.label}</span>
                      </div>
                      <span className="font-medium text-orange-600">{size.price}</span>
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
                      className={`px-3 py-1 rounded-full border text-sm ${
                        selectedOptions.spicyLevel === level
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
                  defaultValue=""
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
                  onClick={() => setQuantity(Math.max(1