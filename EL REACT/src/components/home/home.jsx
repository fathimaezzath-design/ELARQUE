import React, { useState } from "react";
import AnnouncementBar from "../common/AnnouncementBar";
import Navbar from "../common/Navbar";
import HeroSection from "./HeroSection";
import SilhouetteSection from "./SilhouetteSection";
import NewArrivalsSection from "./NewArrivalsSection";
import MostLovedSection from "./MostLovedSection";
import ValuesSection from "./ValuesSection";
import EditorialGallerySection from "./EditorialGallerySection";
import NewsletterSection from "./NewsletterSection";
import Footer from "../common/Footer";

function Home() {
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  const handleAddToCart = (product) => {
    setCartCount((prev) => prev + 1);
    console.log("Added to Cart:", product.name);
  };

  const handleToggleWishlist = (product, isAdded) => {
    setWishlistCount((prev) => (isAdded ? prev + 1 : Math.max(0, prev - 1)));
    console.log("Wishlist Toggled:", product.name, isAdded);
  };

  return (
    <div className="el-home-page" style={styles.page}>
      {/* 1. Top Announcement Bar */}
      <AnnouncementBar />

      {/* 2. Main Navigation Header */}
      <Navbar wishlistCount={wishlistCount} cartCount={cartCount} />

      {/* 3. Hero Section ("Haute Western Tailoring") */}
      <HeroSection />

      {/* 4. Explore by Silhouette (4 Curated Archive Cards) */}
      <SilhouetteSection />

      {/* 5. New Arrivals (4 Product Cards) */}
      <NewArrivalsSection
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* 6. Most Loved by Clients (5 Bestseller Cards) */}
      <MostLovedSection
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* 7. Excellence Without Compromise (4 Sartorial Promise Cards) */}
      <ValuesSection />

      {/* 8. Seen Across Fashion Capitals (6 Editorial Gallery Photos) */}
      <EditorialGallerySection />

      {/* 9. VIP Dispatches Newsletter ("Stay in Style") */}
      <NewsletterSection />

      {/* 10. Footer */}
      <Footer />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "var(--el-cream)",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    position: "relative",
  },
};

export default Home;