"use client";
import React, { useState } from "react";

const Navbar: React.FC = () => {
  // Keeping state in case you need it for other logic later
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Keeping menuItems data structure
  const menuItems = [
    { label: "Home", link: "/" },
    { label: "Dining Spots", link: "/dining" },
    { label: "My Bookings", link: "/bookings" },
    { label: "Emergency", link: "/emergency", color: "#e05a6b" },
  ];
  

  return (
    <>
      {/* The <nav> element and its contents have been removed. 
          We only return the style block to maintain your 
          responsive media queries for the rest of the layout.
      */}
      <style>{`
        /* WINDOWS / DESKTOP VIEW */
        @media (min-width: 851px) {
          .nav-links-desktop { display: flex !important; }
          .hamburger-btn { display: none !important; }
        }

        /* MOBILE VIEW */
        @media (max-width: 850px) {
          .nav-links-desktop { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
};

export default Navbar;