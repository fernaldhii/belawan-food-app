"use client"; // Penting untuk komponen klien di Next.js App Router

import React, { useState, useRef, useEffect, useContext } from "react"; // Import useContext
import { AnimatePresence, motion } from "framer-motion";

// Import komponen terpisah dari folder components
// Pastikan path ini sesuai dengan struktur folder Anda (misalnya, jika MenuSection ada di app/menu/page.jsx)
import OrderModal from "./OrderModal";
import CartBar from "./CartBar";
import { CartContext } from "./CartContext";

const menuItems = [
  // Cumi/Udang
  { id: 1, name: "Cumi Asam Manis", category: "Cumi/Udang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Cumi",
    options: {
      spicyLevel: ["Biasa", "Pedas"],
      size: [
        { label: "Kecil", price: 35000},
        { label: "Besar", price: 40000}
      ]
    }
  },
  { id: 2, name: "Cumi Saus Padang", category: "Cumi/Udang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Cumi",
    options: {
      spicyLevel: ["Biasa", "Pedas"],
      size: [
        { label: "Kecil", price: 35000},
        { label: "Besar", price: 40000}
      ]
    }
  },
  { id: 3, name: "Cumi Saus Tiram", category: "Cumi/Udang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Cumi",
    options: {
      spicyLevel: ["Biasa", "Pedas"],
      size: [
        { label: "Kecil", price: 35000},
        { label: "Besar", price: 40000}
      ]
    }
  },
  { id: 4, name: "Cumi Goreng Tepung", category: "Cumi/Udang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Cumi",
    options: {
      size: [
        { label: "Kecil", price: 35000},
        { label: "Besar", price: 40000}
      ]
    }
  },
  { id: 5, name: "Cumi Kremes", category: "Cumi/Udang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Cumi",
    options: {
      size: [
        { label: "Kecil", price: 35000},
        { label: "Besar", price: 40000}
      ]
    }
  },
  { id: 6, name: "Cumi Saus Mentega", category: "Cumi/Udang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Cumi",
    options: {
      size: [
        { label: "Kecil", price: 35000},
        { label: "Besar", price: 40000}
      ]
    }
  },
  { id: 7, name: "Cumi Sambal Pete", category: "Cumi/Udang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Cumi",
    options: {
      spicyLevel: ["Pedas", "Sangat Pedas"],
      size: [
        { label: "Kecil", price: 35000},
        { label: "Besar", price: 40000}
      ]
    }
  },
  { id: 8, name: "Cumi Tauco", category: "Cumi/Udang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Cumi",
    options: {
      spicyLevel: ["Pedas", "Sangat Pedas"],
      size: [
        { label: "Kecil", price: 35000},
        { label: "Besar", price: 40000}
      ]
    }
  },
  { id: 9, name: "Udang Rebus", category: "Cumi/Udang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Udang",
    options: {
      size: [
        { label: "Kecil", price: 35000},
        { label: "Besar", price: 40000}
      ]
    }
  },

  // Ikan
  { id: 10, name: "Ikan Bawal", category: "Ikan", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ikan",
    options: {
      spicyLevel: ["Biasa", "Pedas"],
    },
    price: 35000
  },
  { id: 11, name: "Ikan Kerapu", category: "Ikan", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ikan",
    options: {
      spicyLevel: ["Biasa", "Pedas"],
    },
    price: 38000
  },
  { id: 12, name: "Ikan Kwe", category: "Ikan", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ikan",
    options: {
      spicyLevel: ["Biasa", "Pedas"],
    },
    price: 38000
  },
  { id: 13, name: "Ikan Gurame", category: "Ikan", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ikan",
    options: {
      spicyLevel: ["Biasa", "Pedas"],
    },
    price: 45000
  },
  { id: 14, name: "Ikan Nila", category: "Ikan", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ikan",
    options: {
      spicyLevel: ["Biasa", "Pedas"],
    },
    price: 25000
  },
  
  //Kepiting
  { id: 15, name: "Kepiting", category: "Kepiting", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Kepiting",
    options: {
      spicyLevel: ["Biasa", "Pedas"],
      rasaMenu: ["Lada Hitam", "Asam Manis", "Saus Padang", "Saus Tiram"],
    },
    price: 50000
  },

  //Kerang
  { id: 16, name: "Kerang", category: "Kerang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Kerang",
    options: {
      spicyLevel: ["Biasa", "Pedas"],
      rasaMenu: ["Lada Hitam", "Asam Manis", "Saus Padang", "Saus Tiram", "Mentega"],
    },
    price: 25000
  },
  { id: 17, name: "Kerang Rebus", category: "Kerang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Kerang",
    options: {
    },
    price: 20000
  },
  { id: 18, name: "Kerang Hijau Goreng", category: "Kerang", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Kerang",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 20000
  },

  // Sayuran
  { id: 19, name: "Capcai Goreng", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Capcai",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 23000
  },
  { id: 20, name: "Capcai Rebus", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Capcai",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 23000
  },
  { id: 21, name: "Nasi Capcai", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Nasi",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 25000
  },
  { id: 22, name: "Nasi Sapo", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Nasi",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 31000
  },
  { id: 23, name: "Safo Tahu Hotplate", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Tahu",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 28000
  },
  { id: 24, name: "Safo Tahu Ori Belawan", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Tahu",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 28000
  },
  { id: 25, name: "Safo Tahu Masak Pedas", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Tahu",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 28000
  },
  { id: 26, name: "Fuyunghai", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Fuyunghai",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 22000
  },
  { id: 27, name: "Toge Ikan Asin", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Toge",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 20000
  },
  { id: 28, name: "Kangkung Tumis Belacan", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Kangkung",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 15000
  },
  { id: 29, name: "Kangkung Tumis", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Kangkung",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 20000
  },
  { id: 30, name: "Kangkung Tumis Hotplate", category: "Sayuran", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Kangkung",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 20000
  },

  // Tongseng
  { id: 31, name: "Tongseng Kambing", category: "Tongseng", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Tongseng",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 25000
  },
  { id: 32, name: "Tongseng Sapi", category: "Tongseng", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Tongseng",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 21000
  },
  { id: 33, name: "Tongseng Ayam", category: "Tongseng", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Tongseng",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 21000
  },

  // Mie
  { id: 34, name: "Mie Goreng", category: "Mie", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Mie",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 28000
  },
  { id: 35, name: "Mie Rebus", category: "Mie", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Mie",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 28000
  },
  { id: 36, name: "Kwetiaw Goreng", category: "Mie", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Kwetiaw",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 28000
  },
  { id: 37, name: "Kwetiaw Rebus", category: "Mie", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Kwetiaw",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 28000
  },
  { id: 38, name: "Bihun Goreng", category: "Mie", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Bihun",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 28000
  },
  { id: 39, name: "Bihun Rebus", category: "Mie", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Bihun",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 28000
  },
  { id: 40, name: "Ifumie Belawan", category: "Mie", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ifumie",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 30000
  },
  { id: 41, name: "Spagety", category: "Mie", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Spagety",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 30000
  },

  // Ayam
  { id: 42, name: "Ayam Mentega", category: "Ayam", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ayam",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
          size: [
          { label: "Kecil", price: 27000},
          { label: "Besar", price: 30000}
        ]
    }
  },
  { id: 43, name: "Ayam Rica-Rica", category: "Ayam", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ayam",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
          size: [
          { label: "Kecil", price: 27000},
          { label: "Besar", price: 30000}
        ]
    }
  },
  { id: 44, name: "Ayam Woku", category: "Ayam", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ayam",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
          size: [
          { label: "Kecil", price: 27000},
          { label: "Besar", price: 30000}
        ]
    }
  },
  { id: 45, name: "Ayam Kuluyuk", category: "Ayam", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ayam",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
          size: [
          { label: "Kecil", price: 27000},
          { label: "Besar", price: 30000}
        ]
    }
  },
  { id: 46, name: "Ayam Cah Jamur", category: "Ayam", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ayam",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
          size: [
          { label: "Kecil", price: 27000},
          { label: "Besar", price: 30000}
        ]
    }
  },
  { id: 47, name: "Ayam Lada Hitam", category: "Ayam", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ayam",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
          size: [
          { label: "Kecil", price: 27000},
          { label: "Besar", price: 30000}
        ]
    }
  },
  { id: 48, name: "Ayam Bistik", category: "Ayam", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ayam",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
          size: [
          { label: "Kecil", price: 30000},
          { label: "Besar", price: 35000}
        ]
    }
  },
  { id: 49, name: "Chicken Katsu", category: "Ayam", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Chicken",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
          size: [
          { label: "Kecil", price: 30000},
          { label: "Besar", price: 35000}
        ]
    }
  },
  { id: 50, name: "Fried Chicken Belawan", category: "Ayam", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Chicken",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
          size: [
          { label: "Kecil", price: 30000},
          { label: "Besar", price: 35000}
        ]
    }
  },
  { id: 51, name: "Ayam", category: "Ayam", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Ayam",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 20000
  },

  // Empek-empek
  { id: 52, name: "Empek-Empek Kapal Selam", category: "Empek-empek", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Pempek",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 17000
  },
  { id: 53, name: "Empek-Empek Lenjer", category: "Empek-empek", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Pempek",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 10000
  },
  { id: 54, name: "Empek-Empek Adaan", category: "Empek-empek", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Pempek",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 8000
  },
  { id: 55, name: "Empek-Empek Tahu", category: "Empek-empek", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Pempek",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 12000
  },
  { id: 56, name: "Empek-Empek Kulit", category: "Empek-empek", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Pempek",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 10000
  },
  { id: 57, name: "Pempek Lenggang", category: "Empek-empek", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Pempek",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 15000
  },
  { id: 58, name: "Tekwan", category: "Empek-empek", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Tekwan",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 15000
  },

  // Bebek
  { id: 59, name: "Bebek Lada Hitam", category: "Bebek", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Bebek",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
          size: [
          { label: "Kecil", price: 35000},
          { label: "Besar", price: 40000}
        ]
    }
  },

  // Soup
  { id: 60, name: "Soup Iga Sapi", category: "Soup", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Soup",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 28000
  },
  { id: 61, name: "Sop Iga bakar", category: "Soup", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Soup",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 35000
  },
  { id: 62, name: "Sop Buntut", category: "Soup", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Soup",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 42000
  },

  // Nasi Goreng
  { id: 63, name: "Nasi Goreng Ayam", category: "Nasi Goreng", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Nasi",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 23000
  },
  { id: 64, name: "Nasi Goreng Pete", category: "Nasi Goreng", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Nasi",
    options: {
          spicyLevel: ["Biasa", "Pedas"],
    },
    price: 23000
  },

  // Lain-lain (optional, bisa ditambah sesuai kebutuhan)
  { id: 65, name: "Nasi Putih", category: "Lain-lain", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Nasi",
    options: {
    },
    price: 5000
  },
  { id: 66, name: "Nasi Uduk", category: "Lain-lain", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Nasi",
    options: {
    },
    price: 6000
  },
  { id: 67, name: "Nasi Putih", category: "Lain-lain", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Nasi",
    options: {
    },
    price: 5000
  },
  { id: 68, name: "Tahu/Tempe Goreng", category: "Lain-lain", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Tahu",
    options: {
    },
    price: 5000
  },
  { id: 69, name: "Sambal Hijau", category: "Lain-lain", image: "https://placehold.co/160x160/FFA500/FFFFFF?text=Sambal",
    options: {
    },
    price: 5000
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

export default function MenuSection() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Hapus state 'cart' lokal karena sekarang dikelola oleh CartContext
  // const [cart, setCart] = useState([]);
  const [animatedItem, setAnimatedItem] = useState(null); // State untuk item yang sedang dianimasikan
  const cartIconRef = useRef(null); // Ref untuk ikon keranjang
  const addToCartButtonRef = useRef(null); // Ref untuk tombol add to cart di modal
  const [pulseCartTrigger, setPulseCartTrigger] = useState(0); // State baru untuk memicu pulse

  // Gunakan CartContext untuk mengakses state dan fungsi keranjang
  const { cart, addToCart } = useContext(CartContext);

  // Debugging: Log ref values after initial render and updates
  useEffect(() => {
    console.log('cartIconRef.current:', cartIconRef.current);
    console.log('addToCartButtonRef.current (when modal is open):', addToCartButtonRef.current);
  }, [isModalOpen]); // Log when modal opens/closes

  const filteredItems =
    selectedCategory === "All"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  const handleOpenModal = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
  };

  // Ubah nama fungsi ini untuk mencerminkan bahwa ia juga menangani animasi
  const handleAddToCartAndAnimate = (orderItem) => {
    // Panggil fungsi addToCart dari CartContext
    addToCart(orderItem);

    // Pemicu animasi pulse pada CartBar
    setPulseCartTrigger(prev => prev + 1); // Tingkatkan nilai untuk memicu useEffect di CartBar

    // Logika Animasi Terbang
    if (addToCartButtonRef.current && cartIconRef.current) {
      const buttonRect = addToCartButtonRef.current.getBoundingClientRect();
      const cartRect = cartIconRef.current.getBoundingClientRect();

      console.log('Button position:', buttonRect);
      console.log('Cart icon position:', cartRect);

      setAnimatedItem({
        image: orderItem.image,
        startPosition: {
          x: buttonRect.left,
          y: buttonRect.top,
          width: buttonRect.width,
          height: buttonRect.height,
        },
        endPosition: {
          x: cartRect.left,
          y: cartRect.top,
          width: cartRect.width,
          height: cartRect.height,
        },
      });

      // Hapus item animasi setelah selesai
      setTimeout(() => {
        setAnimatedItem(null);
      }, 800); // Sesuaikan durasi animasi
    } else {
        console.warn("Refs for animation are not available. addToCartButtonRef:", addToCartButtonRef.current, "cartIconRef:", cartIconRef.current);
    }

    handleCloseModal(); // Tutup modal setelah tambah ke keranjang
  };

  const getDisplayPrice = (item) => {
    if (item.options?.size && item.options.size.length > 0) {
        const minPrice = Math.min(...item.options.size.map(s => s.price));
        const maxPrice = Math.max(...item.options.size.map(s => s.price));
        return `Rp ${minPrice.toLocaleString('id-ID')} - Rp ${maxPrice.toLocaleString('id-ID')}`;
    }
    return `Rp ${item.price.toLocaleString('id-ID')}`;
  };

  return (
    <section className="px-6 md:px-20 py-16 bg-white">
      {/* Filter Buttons */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full border transition text-sm ${
              selectedCategory === cat
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white text-gray-700 border-gray-300 hover:bg-orange-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Menu
      </h2>

      {/* Menu Cards */}
      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-40 object-cover"
              // Fallback image in case the original image fails to load
              onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/160x160/E0E0E0/333333?text=${item.name.replace(/\s/g, '+')}`; }}
            />
            <div className="p-4 space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">
                {item.name}
              </h3>
              <p className="text-orange-600 font-bold">
                {getDisplayPrice(item)}
              </p>
              <button
                onClick={() => handleOpenModal(item)}
                className="w-full mt-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm"
              >
                Pesan Sekarang
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* OrderModal - Passed addToCartButtonRef */}
      {selectedItem && (
        <OrderModal
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onAddToCart={handleAddToCartAndAnimate} // Ganti dengan fungsi baru
          addToCartButtonRef={addToCartButtonRef} // Pass the ref here
        />
      )}

      {/* Animasi Item Terbang */}
      {/* Pastikan motion.img memiliki posisi yang tepat dan z-index tinggi */}
      <AnimatePresence>
        {animatedItem && (
          <motion.img
            src={animatedItem.image}
            initial={{
              x: animatedItem.startPosition.x,
              y: animatedItem.startPosition.y,
              width: animatedItem.startPosition.width,
              height: animatedItem.startPosition.height,
              opacity: 1,
              position: "fixed", // Penting agar elemen melayang di atas yang lain
              zIndex: 1000,      // Pastikan z-index cukup tinggi
              borderRadius: "8px",
              pointerEvents: "none", // Agar tidak mengganggu interaksi mouse
            }}
            animate={{
              x: animatedItem.endPosition.x,
              y: animatedItem.endPosition.y,
              width: 30, // Ukuran ikon keranjang
              height: 30, // Ukuran ikon keranjang
              opacity: 0,
              transition: { duration: 0.7, ease: "easeOut" },
            }}
            exit={{ opacity: 0 }}
            className="object-cover"
            // Fallback image for animation in case the original image fails to load
            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/30x30/E0E0E0/333333?text=X`; }}
          />
        )}
      </AnimatePresence>

      {/* Pop-out Cart Bar - Pass cartIconRef dan pulseCartTrigger */}
      <CartBar cart={cart} cartIconRef={cartIconRef} pulseTrigger={pulseCartTrigger} />
    </section>
  );
}
