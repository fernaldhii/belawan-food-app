// app/menu/page.jsx
"use client"; // INI HARUS JADI BARIS PERTAMA DI FILE INI

import React, { useState, useRef, useEffect, useContext, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Import komponen terpisah
import OrderModal from "../components/OrderModal";
import CartBar from "../components/CartBar";
import { CartContext } from "../components/CartContext";
import HeroSection from "../components/HeroSection";

// ==========================================================
// DEFINISI KONSTANTA & FUNGSI BANTUAN
// ==========================================================

const DEFAULT_NAVBAR_HEIGHT = 80; // Ini hanya nilai fallback default

const svgToDataURI = (svgString) => {
  let cleanedSvgString = svgString.replace(/"/g, "'");
  let finalEncoded = encodeURIComponent(cleanedSvgString);
  return `data:image/svg+xml,${finalEncoded}`;
};

const menuIconSvg = (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const closeIconSvg = (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ==========================================================
// AWAL KOMPONEN UTAMA MenuSection
// ==========================================================

export default function MenuSection({ navbarActualHeight = DEFAULT_NAVBAR_HEIGHT }) { 
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [animatedItem, setAnimatedItem] = useState(null);
  const cartIconRef = useRef(null);
  const addToCartButtonRef = useRef(null);
  const [pulseCartTrigger, setPulseCartTrigger] = useState(0);
  const [currentMenuHeading, setCurrentMenuHeading] = useState("Semua Menu");
  const [isLoading, setIsLoading] = useState(true); 
  const [showFloatingMenuButton, setShowFloatingMenuButton] = useState(true);

  const menuHeadingRef = useRef(null);
  const floatingMenuRef = useRef(null);

  const { cart, addToCart, menuItems, categories, isAuthReady, db, isLoadingMenu } = useContext(CartContext);

  const categoryContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isFloatingDropdownOpen, setIsFloatingDropdownOpen] = useState(false);

  const desktopCategoryRef = useRef(null);
  const [desktopCategoryInitialScrollY, setDesktopCategoryInitialScrollY] = useState(0);
  const [isDesktopCategorySticky, setIsDesktopCategorySticky] = useState(false);
  const [lastScrollYCategory, setLastScrollYCategory] = useState(0);
  const [desktopCategoryHeight, setDesktopCategoryHeight] = useState(0);

  // === START: Lazy Loading State and Refs - TELAH DIMODIFIKASI ===
  const [visibleItems, setVisibleItems] = useState({});
  const observer = useRef(null);
  // === END: Lazy Loading State and Refs ===

  useEffect(() => {
    setIsLoading(isLoadingMenu);
  }, [isLoadingMenu]);


  useEffect(() => {
    const updateCategoryPosition = () => {
      if (desktopCategoryRef.current) {
        const rect = desktopCategoryRef.current.getBoundingClientRect();
        // Calculation should now be relative to the actual start of the sticky element
        // which itself will be affected by the navbar being fixed.
        const scrollYPoint = window.scrollY + rect.top - navbarActualHeight; 
        setDesktopCategoryInitialScrollY(scrollYPoint);
        setDesktopCategoryHeight(desktopCategoryRef.current.offsetHeight);
      }
    };

    if (typeof window !== 'undefined') {
      updateCategoryPosition();
      window.addEventListener('resize', updateCategoryPosition);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateCategoryPosition);
      }
    };
  }, [categories, menuItems, navbarActualHeight]);

  useEffect(() => {
    const handleScrollDesktopCategory = () => {
      const currentScrollY = window.scrollY;
      const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;

      if (isMobileView) {
        setIsDesktopCategorySticky(false);
        return;
      }

      if (currentScrollY >= desktopCategoryInitialScrollY) {
        if (currentScrollY < lastScrollYCategory) {
          setIsDesktopCategorySticky(true);
        } else {
          setIsDesktopCategorySticky(false);
        }
      } else {
        setIsDesktopCategorySticky(false);
      }
      setLastScrollYCategory(currentScrollY);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScrollDesktopCategory);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', handleScrollDesktopCategory);
      }
    };
  }, [lastScrollYCategory, desktopCategoryInitialScrollY, desktopCategoryHeight]);

  useEffect(() => {
    const container = categoryContainerRef.current;
    if (!container) {
        setShowLeftArrow(false);
        setShowRightArrow(false);
        return;
    }

    const updateArrowVisibility = () => {
      if (container.scrollWidth > container.clientWidth) {
        setShowLeftArrow(container.scrollLeft > 5);
        setShowRightArrow(Math.ceil(container.scrollLeft) < (container.scrollWidth - container.clientWidth - 5));
      } else {
        setShowLeftArrow(false);
        setShowRightArrow(false);
      }
    };

    updateArrowVisibility();
    container.addEventListener('scroll', updateArrowVisibility);
    window.addEventListener('resize', updateArrowVisibility);

    return () => {
      container.removeEventListener('scroll', updateArrowVisibility);
      window.removeEventListener('resize', updateArrowVisibility);
    };
  }, [categories, menuItems]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isFloatingDropdownOpen && floatingMenuRef.current && !floatingMenuRef.current.contains(event.target)) {
        setIsFloatingDropdownOpen(false);
      }
    };

    if (typeof window !== 'undefined') {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener("mousedown", handleClickOutside);
      }
    };
  }, [isFloatingDropdownOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isModalOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = '';
      }
      }
  }, [isModalOpen]);

  // === START: Lazy Loading Implementation - TELAH DIMODIFIKASI ===
  useEffect(() => {
    // Pastikan IntersectionObserver tersedia di lingkungan browser
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      observer.current = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const itemId = entry.target.dataset.id;
            setVisibleItems(prev => ({ ...prev, [itemId]: true }));
            observer.current.unobserve(entry.target); // Berhenti mengamati setelah terlihat
          }
        });
      }, {
        rootMargin: '0px', // Memuat item saat 0px dari viewport
        threshold: 0.1 // 10% dari item terlihat untuk memicu
      });

      // Cleanup function untuk memutuskan observer saat komponen dilepas
      return () => {
        if (observer.current) {
          observer.current.disconnect();
          observer.current = null;
        }
      };
    }
  }, []); // [] agar hanya dijalankan sekali saat mount

  // Callback ref untuk setiap item kartu menu
  const itemCardRef = useCallback(node => {
    if (node) {
      const itemId = node.dataset.id;
      // Hanya observasi jika observer sudah ada dan item belum terlihat
      if (observer.current && !visibleItems[itemId]) { 
        observer.current.observe(node);
      }
    }
  }, [visibleItems]); // Dependency `visibleItems` agar ref disetel ulang saat item baru terlihat/terfilter
  // === END: Lazy Loading Implementation ===

  const scrollCategories = (direction) => {
    if (categoryContainerRef.current) {
      const scrollAmount = 200;
      categoryContainerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const filteredItems =
    selectedCategory === "All"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  const handleOpenModal = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
    setShowFloatingMenuButton(false);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
    setShowFloatingMenuButton(true);
  };

  const handleAddToCartAndAnimate = (orderItem) => {
    addToCart(orderItem);
    setPulseCartTrigger(prev => prev + 1);

    if (addToCartButtonRef.current && cartIconRef.current) {
      const buttonRect = addToCartButtonRef.current.getBoundingClientRect();
      const cartRect = cartIconRef.current.getBoundingClientRect();

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
          width: 30,
          height: 30,
        },
      });

      setTimeout(() => {
        setAnimatedItem(null);
      }, 800);
    } else {
        console.warn("Refs for animation are not available. This might affect the item-to-cart animation.");
    }

    handleCloseModal();
  };

  const getDisplayPrice = (item) => {
    // Menangani item.price yang mungkin tidak ada atau options.size
    if (item.options?.size && item.options.size.length > 0) {
        // Jika ada opsi ukuran, tampilkan rentang harga
        const minPrice = Math.min(...item.options.size.map(s => s.price));
        const maxPrice = Math.max(...item.options.size.map(s => s.price));
        if (minPrice === maxPrice) {
            return `Rp ${minPrice.toLocaleString('id-ID')}`;
        }
        return `Rp ${minPrice.toLocaleString('id-ID')} - Rp ${maxPrice.toLocaleString('id-ID')}`;
    }
    // Jika tidak ada opsi ukuran tapi ada price langsung
    if (typeof item.price === 'number') {
      return `Rp ${item.price.toLocaleString('id-ID')}`;
    }
    // Default jika harga tidak tersedia
    return 'Harga tidak tersedia';
  };


  const handleCategoryClick = (catName) => { // Menerima nama kategori
    setIsLoading(true);
    setSelectedCategory(catName); // Set nama kategori
    if (catName === "All") {
      setCurrentMenuHeading("Menu");
    } else {
      setCurrentMenuHeading(catName);
    }
    setIsFloatingDropdownOpen(false);
    // Reset visibleItems saat kategori berubah agar lazy loading bekerja lagi untuk item baru
    // === BARIS BARU UNTUK LAZY LOADING ===
    setVisibleItems({}); 
    // === AKHIR BARIS BARU UNTUK LAZY LOADING ===
    setTimeout(() => {
      setIsLoading(false);
      if (menuHeadingRef.current) {
        // dynamicOffset kini hanya memperhitungkan tinggi desktopCategorySticky
        const dynamicOffset = isDesktopCategorySticky
          ? navbarActualHeight + desktopCategoryHeight + 20
          : navbarActualHeight + 20; 
        
        const headerOffset = window.innerWidth < 768 ? 20 : dynamicOffset;
        const elementPosition = menuHeadingRef.current.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: elementPosition - headerOffset,
          behavior: "smooth"
        });
      }
    }, 500);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 }, // Added y: 50 for a subtle slide-up effect
    visible: { opacity: 1, y: 0 },
  };

  const SkeletonCard = () => (
    <div className="bg-white rounded-md shadow-none overflow-hidden animate-pulse">
      <div className="w-full h-40 bg-gray-200 rounded-t-md"></div>
      <div className="p-4 space-y-2">
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        <div className="h-10 bg-gray-300 rounded-lg w-full mt-4"></div>
      </div>
    </div>
  );

  console.log("[MenuSection Debug] Categories being rendered:", categories.map(cat => ({id: cat.id, name: cat.name})));


  return (
    // Div utama ini tidak memerlukan padding-top lagi karena main di layout sudah diubah.
    <div className="min-h-screen bg-gray-50"> 
      {/* HeroSection akan dimulai dari top:0 */}
      <HeroSection backgroundImage="/images/background-hero.png" className="rounded-bl-lg" />

      {/* Section ini akan dimulai tepat setelah HeroSection, dengan padding atas untuk menjauh dari navbar */}
      <section 
        className="px-6 md:px-20 bg-gray-50 pb-16" 
        style={{ paddingTop: `${navbarActualHeight}px` }} // Tambahkan padding atas di sini
      > 
        <div
          ref={desktopCategoryRef}
          className={`
            hidden md:block mb-8 relative w-full
            ${isDesktopCategorySticky ? 'fixed left-0 right-0 bg-white shadow-md z-40' : ''}
            transition-all duration-300 ease-in-out
          `}
          // Sesuaikan posisi top untuk sticky category filter
          style={isDesktopCategorySticky ? { top: `${navbarActualHeight}px` } : {}}
        >
          <div className="relative flex items-center w-full py-3">
            {showLeftArrow && (
              <button
                onClick={() => scrollCategories('left')}
                className="absolute left-0 z-20 p-2 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {showLeftArrow && (
                <div className="absolute left-10 w-20 h-full bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
            )}

            <div
              ref={categoryContainerRef}
              id="category-filter-container"
              className="flex flex-nowrap overflow-x-auto whitespace-nowrap gap-3 flex-grow px-10 md:px-10 py-3"
            >
              {categories.map((catObj) => (
                <button
                  key={catObj.id} // Gunakan catObj.id sebagai key
                  onClick={() => handleCategoryClick(catObj.name)} // Kirim catObj.name
                  className={`px-4 py-2 rounded-full border transition text-sm flex-shrink-0
                    ${selectedCategory === catObj.name // Bandingkan dengan catObj.name
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
                    }`}
                >
                  {catObj.name} {/* Tampilkan catObj.name */}
                </button>
              ))}
            </div>

            {showRightArrow && (
                <div className="absolute right-10 w-20 h-full bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>
            )}

            {showRightArrow && (
              <button
                onClick={() => scrollCategories('right')}
                className="absolute right-0 z-20 p-2 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className={`pt-0 md:${isDesktopCategorySticky ? `pt-[${desktopCategoryHeight}px]` : 'pt-0'}`}>
          {isLoading && (
            <div className="text-center text-orange-500 font-semibold mb-4 animate-pulse">
              Memuat Menu...
            </div>
          )}

          <h2 ref={menuHeadingRef} className="text-xl md:text-2xl mt-0 font-semibold text-gray-800 text-left mb-10 capitalize">
            {currentMenuHeading}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <SkeletonCard key={`skeleton-${index}`} />
              ))
            ) : (
              <AnimatePresence>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <motion.div
                      key={item.id}
                      ref={itemCardRef} // Menghubungkan ref untuk lazy loading
                      data-id={item.id} // Memastikan data-id ada untuk observer
                      layout
                      initial="hidden"
                      animate={visibleItems[item.id] ? "visible" : "hidden"} // Animasi berdasarkan visibilitas
                      exit="hidden"
                      variants={cardVariants}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col relative hover:shadow-md transform hover:-translate-y-1 transition-all duration-300"
                      onClick={() => handleOpenModal(item)}
                    >
                      {/* Konten Gambar: Dimuat secara kondisional */}
                      {visibleItems[item.id] ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-32 object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/160x160/E0E0E0/333333?text=${item.name.replace(/\s/g, '+')}`; }}
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-200 animate-pulse flex items-center justify-center text-gray-500 text-sm">
                          Memuat gambar...
                        </div>
                      )}
                      
                      <div className="p-4 relative flex-grow">
                        <div className="flex-grow md:min-h-[72px] pb-12">
                          <h3 className="text-sm md:text-md font-normal text-gray-800 mb-1.5 md:whitespace-nowrap md:overflow-hidden md:text-ellipsis">
                            {item.name}
                          </h3>
                          <p className="text-orange-600 font-semibold text-md">{getDisplayPrice(item)}</p>
                        </div>
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="w-12 h-12 bg-orange-500 flex items-center justify-center text-white py-2 rounded-full shadow-lg hover:bg-orange-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50 absolute bottom-4 right-4"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center text-gray-600 text-lg py-10">
                    Tidak ada menu di kategori ini.
                  </div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </section>

      {isModalOpen && selectedItem && (
        <OrderModal
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onAddToCart={handleAddToCartAndAnimate}
          addToCartButtonRef={addToCartButtonRef}
        />
      )}

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
              position: "fixed",
              zIndex: 1000,
              borderRadius: "8px",
              pointerEvents: "none",
            }}
            animate={{
              x: animatedItem.endPosition.x,
              y: animatedItem.endPosition.y,
              width: 30,
              height: 30,
              opacity: 0,
              transition: { duration: 0.7, ease: "easeOut" },
            }}
            exit={{ opacity: 0 }}
            className="object-cover"
            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/30x30/E0E0E0/333333?text=X`; }}
          />
        )}
      </AnimatePresence>

      <CartBar cart={cart} cartIconRef={cartIconRef} pulseTrigger={pulseCartTrigger} />

      {/* Floating Category Filter (Dropdown/Drop-up) - HANYA UNTUK MOBILE */}
      <AnimatePresence>
        {showFloatingMenuButton && (
          <motion.div
            key="floating-filter"
            ref={floatingMenuRef}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="
              fixed
              bottom-20 left-1/3 transform -translate-x-1/2
              z-50
              block md:hidden
            "
          >
            <motion.button
              onClick={() => setIsFloatingDropdownOpen(!isFloatingDropdownOpen)}
              initial={false}
              // Animate lebar dan border-radius tombol utama
              animate={{
                width: isFloatingDropdownOpen ? '48px' : '112px',
                borderRadius: isFloatingDropdownOpen ? '50%' : '9999px',
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`
                bg-gray-600 text-white text-xs
                p-3 shadow-lg
                flex items-center justify-center
                hover:bg-gray-700 transition-colors
                relative overflow-hidden
                h-12
                whitespace-nowrap
              `}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isFloatingDropdownOpen ? (
                  <motion.div
                    key="close-icon-content"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center w-full h-full absolute inset-0"
                  >
                    {closeIconSvg}
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu-text-content"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center space-x-2 w-full"
                  >
                    {menuIconSvg}
                    <span>Menu</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <AnimatePresence>
              {isFloatingDropdownOpen && (
                <motion.div
                  key="floating-dropdown"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="
                    absolute bottom-full left-1/2 transform -translate-x-1/2
                    mb-2
                    bg-white rounded-lg shadow-xl
                    p-2 w-40 max-h-60 overflow-y-auto
                    border border-gray-200
                  "
                >
                  {categories.map((catObj) => (
                    <button
                      key={catObj.id} // Gunakan catObj.id sebagai key
                      onClick={() => handleCategoryClick(catObj.name)} // Kirim catObj.name
                      className={`
                        block w-full text-left px-3 py-2
                        rounded-md transition-colors
                        ${selectedCategory === catObj.name // Bandingkan dengan catObj.name
                          ? "bg-orange-500 text-white font-semibold"
                          : "text-gray-700 hover:bg-gray-100"
                        }
                      `}
                    >
                      {catObj.name === "All" ? "Semua Kategori" : catObj.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        #category-filter-container::-webkit-scrollbar {
          display: none;
          width: 0 !important;
          height: 0 !important;
        }

        #category-filter-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
