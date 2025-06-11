// app/components/HeroSection.jsx
import React from 'react';

/**
 * Komponen HeroSection dengan layout dua kolom (teks & gambar)
 * dan opsi untuk latar belakang gambar penuh.
 *
 * @param {object} props - Properti komponen.
 * @param {string} [props.backgroundImage] - URL gambar yang akan digunakan sebagai latar belakang section.
 * Jika tidak disediakan, section akan menggunakan class 'bg-background'.
 * @param {string} [props.className] - Kelas Tailwind CSS tambahan yang akan diterapkan pada elemen section utama.
 */
const HeroSection = ({ backgroundImage, className = '' }) => { // Tambahkan className sebagai prop
  // Object style for background image, will be empty if no backgroundImage
  const sectionStyle = backgroundImage
    ? {
        backgroundImage: `url('${backgroundImage}')`,
        backgroundSize: 'cover',   // Image will cover the entire area
        backgroundPosition: 'center', // Image positioned in the center
      }
    : {};

  // Determine text color based on whether there's a background image
  // If there's a background image, text tends to be white for contrast.
  // If not, text uses your default gray color.
  const headingTextColor = backgroundImage ? 'text-white' : 'text-gray-800';
  const paragraphTextColor = backgroundImage ? 'text-white' : 'text-gray-600';

  return (
    <section
      // Base styling for section: flexbox for layout, padding, and conditional background.
      // 'relative' is needed if there's an overlay or z-index.
      // Apply the passed className here.
      className={`
        relative h-[400px] md:h-[400px] bg-cover bg-center flex items-center justify-center text-center
        px-6 md:px-20 py-20
        ${backgroundImage ? 'relative' : 'bg-background'}
        ${className} // Apply additional classes here
      `}
      style={sectionStyle} // Apply inline style for background image
    >
      {/* Overlay for text readability if there's a background image. */}
      {/* This will slightly darken the background image. */}
      {backgroundImage && <div className="absolute inset-0 bg-black opacity-60"></div>}

      {/* Text Section */}
      <div className=" text-center mt-16 mb-16 md:text-left z-10"> {/* z-10 so it's above the overlay */}
        <h1 className={`text-2xl md:text-3xl font-semibold leading-tight ${headingTextColor}`}>
          Selamat Datang di Belawan Seafood
        </h1>
        <p className={`text-sm mt-8 md:text-lg ${paragraphTextColor}`}>
          Pesan menu makanan Belawan favoritmu langsung dari sini.
        </p>
        {/* You can add buttons or links here if needed */}
      </div>

      {/* Image Section */}
      <div className="md:w-1/2 ml-3 mt-3 rounded-lg mb-6 md:mb-0 z-10"> {/* z-10 so it's above the overlay */}
        {/* No content here, assuming it's for layout or future image */}
      </div>
    </section>
  );
};

export default HeroSection;
