import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";


function Layout() {

  const getIsMobile = () => {
    return window.innerWidth <= 768;
  };


  const [isMobile, setIsMobile] = useState(
    getIsMobile()
  );


  const [sidebarOpen, setSidebarOpen] = useState(
    !getIsMobile()
  );


  // =====================================================
  // RESPONSIVE SCREEN DETECTION
  // =====================================================

  useEffect(() => {

    const handleResize = () => {

      const mobile =
        window.innerWidth <= 768;

      setIsMobile(mobile);

      /*
       * Desktop = sidebar open
       * Mobile = sidebar closed
       */

      if (mobile) {

        setSidebarOpen(false);

      } else {

        setSidebarOpen(true);

      }

    };


    window.addEventListener(
      "resize",
      handleResize
    );


    return () => {

      window.removeEventListener(
        "resize",
        handleResize
      );

    };

  }, []);


  // =====================================================
  // OPEN SIDEBAR
  // =====================================================

  const openSidebar = () => {

    setSidebarOpen(true);

  };


  // =====================================================
  // CLOSE SIDEBAR
  // =====================================================

  const closeSidebar = () => {

    setSidebarOpen(false);

  };


  // =====================================================
  // PARENT LAYOUT CLASSES
  // =====================================================

  const layoutClass = [

    "fleet-layout",

    sidebarOpen
      ? "sidebar-open"
      : "sidebar-closed",

    isMobile
      ? "fleet-mobile"
      : "fleet-desktop"

  ].join(" ");


  return (

    <div className={layoutClass}>


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <Sidebar
        isOpen={sidebarOpen}
        isMobile={isMobile}
        onClose={closeSidebar}
      />


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="fleet-main">


        <Navbar
          isMobile={isMobile}
          onMenuClick={openSidebar}
        />


        <div className="fleet-page-content">

          <Outlet />

        </div>


      </main>

    </div>

  );

}


export default Layout;