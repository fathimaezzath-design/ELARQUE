/**
 * ELARQUE Home Page Curated Editorial Dataset
 * 
 * Haute Western Luxury Tailoring - Curated Visual References
 * All image assets are organized individually with explicit aspect ratios.
 */

export const ANNOUNCEMENT_DATA = {
  text: " WHITE-GLOVE ARCHIVE DELIVERY ON ALL ORDERS OVER ₹5,000",
  linkText: "DISCOVER THE SERVICE",
  linkUrl: "#values",
};

export const NAV_LINKS = [
  { label: "SHOP", href: "/#shop" },
  { label: "COLLECTIONS", href: "/#collections" },
  { label: "BEST SELLERS", href: "/#bestsellers" },
  { label: "CATEGORIES", href: "/#categories" },
  { label: "NEW ARRIVALS", href: "/#new-arrivals" },
];

export const HERO_DATA = {
  eyebrow: "AUTUMN / WINTER 2026 COUTURE",
  headingMain: "Haute Western",
  headingAccent: "Tailoring",
  description:
    "A modern cadence of couture precision and rugged western spirit. Structured silhouettes refined with bespoke artisanal craft and enduring elegance.",
  primaryCta: {
    label: "SHOP BEST SELLER",
    href: "#bestsellers",
  },
  secondaryCta: {
    label: "VIEW COLLECTION",
    href: "#collections",
  },
  metrics: [
    { value: "01", label: "RUGGED LUXURY TAILORING" },
    { value: "100%", label: "SARTORIAL PURITY" },
    { value: "Paris", label: "ATELIER ARCHIVE" },
  ],
  // Individual Portrait Asset (3:4 ratio) - Tailored coat & hat in architectural setting
  heroImage: {
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85",
    alt: "ELARQUE Haute Western Tailoring in French Salon",
  },
  // Floating overlay product card
  featuredCard: {
    tag: "Quick Look",
    badge: "BEST SELLER",
    title: "Structured Blazer Dress",
    description: "Sculptural tailoring in deep wine double-face virgin wool.",
    price: 4999,
    originalPrice: 6499,
    image: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=400&q=80",
    ctaLabel: "Discover Piece",
  },
};

export const SILHOUETTES_DATA = {
  eyebrow: "CURATED ARCHIVES",
  title: "Explore By Silhouette",
  viewAllLink: {
    label: "VIEW ARCHIVE (4) →",
    href: "#collections",
  },
  items: [
    {
      id: "formal-suiting",
      badge: "AUTUMN SUITING",
      title: "Formal Suiting & Trousers",
      subtitle: "Sharp lapels and fluid draping rooted in heritage salon styling.",
      cta: "EXPLORE SILHOUETTE →",
      href: "#collections",
      // Suited editorial in classic interior
      image: "https://images.unsplash.com/photo-1550614000-4895a10e1bfd?auto=format&fit=crop&w=800&q=85",
      alt: "Formal Suiting & Trousers",
    },
    {
      id: "skirt-coord-sets",
      badge: "SPRING / FALL EDIT",
      title: "Skirt & Co-ord Sets",
      subtitle: "Voluminous tiered pleats paired with cinched waistcoat cuts.",
      cta: "EXPLORE SILHOUETTE →",
      href: "#collections",
      // Tiered editorial skirt in stone architecture
      image: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=800&q=85",
      alt: "Skirt & Co-ord Sets",
    },
    {
      id: "elevated-casuals",
      badge: "URBAN FRONTIER",
      title: "Elevated Casuals",
      subtitle: "Relaxed silk western button-ups and tailored high-rise denim.",
      cta: "EXPLORE SILHOUETTE →",
      href: "#collections",
      // Tailored shirt & high-waist trousers in historic arches
      image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=85",
      alt: "Elevated Casuals",
    },
    {
      id: "haute-western-dresses",
      badge: "COUTURE SIGNATURE",
      title: "Haute Western Dresses",
      subtitle: "Double-breasted coat dresses and sculptural fringe evening wear.",
      cta: "EXPLORE SILHOUETTE →",
      href: "#collections",
      // Sculptural burgundy dress in architectural courtyard
      image: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=800&q=85",
      alt: "Haute Western Dresses",
    },
  ],
};

export const NEW_ARRIVALS_DATA = {
  eyebrow: "THE LATEST DROPS",
  title: "New Arrivals",
  viewAllLink: {
    label: "VIEW ALL NEW PIECES →",
    href: "#new-arrivals",
  },
  products: [
    {
      id: "na-1",
      name: "Satin Slip Dress",
      fabric: "Pure Silk Satin Bias Cut",
      price: 3499,
      originalPrice: 4499,
      rating: 4.8,
      reviewsCount: 28,
      badge: "NEW",
      image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=700&q=85",
    },
    {
      id: "na-2",
      name: "Tailored Frontier Blazer",
      fabric: "Structured Double-Breasted Wool",
      price: 5899,
      originalPrice: 7299,
      rating: 4.9,
      reviewsCount: 42,
      badge: "NEW",
      image: "https://images.unsplash.com/photo-1550614000-4895a10e1bfd?auto=format&fit=crop&w=700&q=85",
    },
    {
      id: "na-3",
      name: "Pleated Skirt Ensemble",
      fabric: "Two-Piece Tiered Crepe Set",
      price: 4299,
      originalPrice: 5199,
      rating: 4.7,
      reviewsCount: 19,
      badge: "NEW",
      image: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=700&q=85",
    },
    {
      id: "na-4",
      name: "Architectural Maxi Dress",
      fabric: "Fluted Hem Evening Couture",
      price: 6499,
      originalPrice: 8299,
      rating: 5.0,
      reviewsCount: 34,
      badge: "NEW",
      image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=700&q=85",
    },
  ],
};

export const MOST_LOVED_DATA = {
  eyebrow: "BESTSELLER EDITORIAL SELECTION",
  title: "Most Loved by Clients",
  subtitle:
    "A collection of client favorites, defining our vision of modern luxury western dressing.",
  products: [
    {
      id: "ml-1",
      name: "Structured Blazer Dress",
      fabric: "Double-Faced Virgin Wool",
      price: 4999,
      originalPrice: 6499,
      rating: 4.9,
      reviewsCount: 88,
      badge: "BEST SELLER",
      image: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=700&q=85",
    },
    {
      id: "ml-2",
      name: "Empress Tiered Frontier Dress",
      fabric: "Tiered Georgette & Velvet Detail",
      price: 6899,
      originalPrice: 8599,
      rating: 5.0,
      reviewsCount: 64,
      badge: "BEST SELLER",
      image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=700&q=85",
    },
    {
      id: "ml-3",
      name: "Pleated Silk Frontier Trousers",
      fabric: "High-Waist Wide-Leg Crepe",
      price: 3799,
      originalPrice: 4599,
      rating: 4.8,
      reviewsCount: 52,
      badge: "BEST SELLER",
      image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=85",
    },
    {
      id: "ml-4",
      name: "Architectural Tuxedo Vest",
      fabric: "Satin-Lapel Tailored Waistcoat",
      price: 4499,
      originalPrice: 5499,
      rating: 4.9,
      reviewsCount: 39,
      badge: "BEST SELLER",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=85",
    },
    {
      id: "ml-5",
      name: "Embroidered Frontier Jacket",
      fabric: "Hand-Finished Bullion Thread",
      price: 7299,
      originalPrice: 9199,
      rating: 5.0,
      reviewsCount: 110,
      badge: "BEST SELLER",
      image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=700&q=85",
    },
  ],
};

export const VALUES_DATA = {
  eyebrow: "OUR SARTORIAL PROMISE",
  titleMain: "Excellence Without",
  titleAccent: "Compromise",
  items: [
    {
      id: "delivery",
      iconName: "Truck",
      title: "Bespoke Delivery",
      description: "White-glove priority shipping in climate-controlled archival boxes.",
    },
    {
      id: "checkout",
      iconName: "ShieldCheck",
      title: "Protected Salon Checkout",
      description: "Discreet end-to-end encrypted transactions with bespoke concierge support.",
    },
    {
      id: "fitting",
      iconName: "Sparkles",
      title: "14-Day House Fitting",
      description: "Experience our silhouettes in your home with  returns.",
    },
    {
      id: "authenticity",
      iconName: "Award",
      title: "Sartorial Authenticity",
      description: "Every piece accompanied by an atelier certificate of numbered authenticity.",
    },
  ],
};

export const EDITORIAL_GALLERY_DATA = {
  eyebrow: "CULTURE & EDITORIAL",
  title: "Seen Across Fashion Capitals",
  viewLink: {
    label: "READ THE EDITORIAL →",
    href: "#editorial",
  },
  photos: [
    {
      id: "gallery-1",
      city: "Paris",
      caption: "Place Vendôme Presentation",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=85",
    },
    {
      id: "gallery-2",
      city: "Milan",
      caption: "Via Montenapoleone Salon",
      image: "https://images.unsplash.com/photo-1550614000-4895a10e1bfd?auto=format&fit=crop&w=600&q=85",
    },
    {
      id: "gallery-3",
      city: "New York",
      caption: "SoHo Runway Showcase",
      image: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=600&q=85",
    },
    {
      id: "gallery-4",
      city: "London",
      caption: "Mayfair Private Fittings",
      image: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=600&q=85",
    },
    {
      id: "gallery-5",
      city: "Atelier",
      caption: "Bullion Hardware & Cufflinks",
      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=85",
    },
    {
      id: "gallery-6",
      city: "Venice",
      caption: "Grand Canal Evening Gala",
      image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=85",
    },
  ],
};

export const NEWSLETTER_DATA = {
  eyebrow: "INVITATION ONLY DISPATCHES",
  title: "Stay in Style",
  description:
    "Receive private salon invitations, archive release notifications, and bespoke editorial dispatches directly to your inbox.",
  disclaimer: "Discretion guaranteed. No spam, ever.",
};

export const FOOTER_DATA = {
  brand: {
    name: "ELARQUE",
    statement:
      "Crafted at the intersection of haute couture precision and American western frontier heritage. Handcrafted garments with archival integrity.",
    salons: "PARIS • MILAN • NEW YORK",
    email: "client@elarque.com",
    phone: "+1 (800) 352-7783",
  },
  columns: [
    {
      title: "SHOP",
      links: [
        { label: "All Ready-to-Wear", href: "#collections" },
        { label: "Suiting & Blazers", href: "#collections" },
        { label: "Frontier Dresses", href: "#collections" },
        { label: "Skirt & Co-ords", href: "#collections" },
        { label: "Silk & Trousers", href: "#collections" },
        { label: "Gift Cards", href: "#collections" },
      ],
    },
    {
      title: "CLIENT SUPPORT",
      links: [
        { label: "Concierge Contact", href: "#support" },
        { label: "Bespoke Sizing Consultation", href: "#support" },
        { label: "Archive & Shipping Guide", href: "#support" },
        { label: "14-Day House Fitting", href: "#support" },
        { label: "Garment Care & Maintenance", href: "#support" },
      ],
    },
    {
      title: "THE ATELIER",
      links: [
        { label: "Heritage & Craft", href: "#atelier" },
        { label: "Sustainability Manifest", href: "#atelier" },
        { label: "Press & Media", href: "#atelier" },
        { label: "Private Salons", href: "#atelier" },
        { label: "Career Inquiries", href: "#atelier" },
      ],
    },
  ],
  legal: [
    { label: "Terms of Service", href: "#terms" },
    { label: "Privacy Policy", href: "#privacy" },
    { label: "Sizing Guide", href: "#sizing" },
  ],
  copyright: `© ${new Date().getFullYear()} ELARQUE Haute Western Couture. All rights reserved.`,
};
