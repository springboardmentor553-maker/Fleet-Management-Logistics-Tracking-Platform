import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  FaBell,
  FaUserCircle,
  FaCheck,
} from "react-icons/fa";

import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notificationService";


function Navbar() {

  const user = JSON.parse(
    localStorage.getItem(
      "user"
    ) || "null"
  );


  const userName =
    user?.name || "User";


  const userRole =
    user?.role || "User";


  const formattedRole =
    userRole.replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );


  const [
    notifications,
    setNotifications,
  ] = useState([]);


  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);


  const [
    showNotifications,
    setShowNotifications,
  ] = useState(false);


  const notificationRef =
    useRef(null);


  // ==========================================================
  // LOAD NOTIFICATIONS
  // ==========================================================

  const loadNotificationData =
    async () => {

      try {

        const [
          items,
          count,
        ] = await Promise.all([

          getNotifications(),

          getUnreadNotificationCount(),

        ]);


        setNotifications(

          Array.isArray(items)
            ? items
            : []

        );


        setUnreadCount(
          count
        );


      } catch (error) {

        console.warn(
          "Unable to load notifications:",
          error
        );

      }

    };


  useEffect(() => {

    loadNotificationData();


    const interval =
      setInterval(

        loadNotificationData,

        15000

      );


    return () => {

      clearInterval(
        interval
      );

    };

  }, []);


  // ==========================================================
  // CLOSE DROPDOWN OUTSIDE CLICK
  // ==========================================================

  useEffect(() => {

    const handleOutsideClick =
      (event) => {

        if (

          notificationRef.current &&

          !notificationRef.current
            .contains(
              event.target
            )

        ) {

          setShowNotifications(
            false
          );

        }

      };


    document.addEventListener(

      "mousedown",

      handleOutsideClick

    );


    return () => {

      document.removeEventListener(

        "mousedown",

        handleOutsideClick

      );

    };

  }, []);


  // ==========================================================
  // MARK ONE READ
  // ==========================================================

  const handleNotificationClick =
    async (
      notification
    ) => {

      if (
        !notification?.id
      ) {

        return;

      }


      try {

        if (
          !notification.is_read
        ) {

          await markNotificationRead(

            notification.id

          );

        }


        setNotifications(

          (current) =>

            current.map(

              (item) =>

                item.id ===
                notification.id

                  ? {
                      ...item,
                      is_read:
                        true,
                    }

                  : item

            )

        );


        setUnreadCount(

          (current) =>

            notification.is_read

              ? current

              : Math.max(
                  0,
                  current - 1
                )

        );


      } catch (error) {

        console.warn(

          "Unable to mark notification as read:",

          error

        );

      }

    };


  // ==========================================================
  // MARK ALL READ
  // ==========================================================

  const handleMarkAllRead =
    async () => {

      if (
        unreadCount === 0
      ) {

        return;

      }


      try {

        await markAllNotificationsRead();


        setNotifications(

          (current) =>

            current.map(

              (item) => ({

                ...item,

                is_read:
                  true,

              })

            )

        );


        setUnreadCount(
          0
        );


      } catch (error) {

        console.warn(

          "Unable to mark all notifications as read:",

          error

        );

      }

    };


  // ==========================================================
  // FORMAT TIME
  // ==========================================================

  const formatNotificationTime =
    (value) => {

      if (!value) {

        return "";

      }


      const date =
        new Date(value);


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {

        return "";

      }


      return date.toLocaleString(
        "en-IN",
        {
          day:
            "2-digit",

          month:
            "short",

          hour:
            "2-digit",

          minute:
            "2-digit",

        }
      );

    };


  return (

    <header className="bg-slate-900 h-20 border-b border-slate-800 flex items-center justify-between px-8">


      {/* ==================================================
          PAGE TITLE
      ================================================== */}

      <div>

        <h1 className="text-2xl font-bold text-white">

          Logistics Management Platform

        </h1>


        <p className="text-sm text-slate-400">

          Welcome back, {userName}

        </p>

      </div>


      {/* ==================================================
          USER AREA
      ================================================== */}

      <div className="flex items-center gap-6">


        {/* ==================================================
            NOTIFICATION BELL
        ================================================== */}

        <div
          className="relative"
          ref={notificationRef}
        >

          <button
            type="button"
            onClick={() =>
              setShowNotifications(
                (current) =>
                  !current
              )
            }
            className="relative text-slate-400 hover:text-white transition"
            title="Notifications"
          >

            <FaBell size={20} />


            {unreadCount > 0 && (

              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">

                {unreadCount > 99
                  ? "99+"
                  : unreadCount}

              </span>

            )}

          </button>


          {/* ==================================================
              NOTIFICATION DROPDOWN
          ================================================== */}

          {showNotifications && (

            <div className="absolute right-0 top-10 z-50 w-96 max-w-[calc(100vw-2rem)] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">


              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">

                <div>

                  <h3 className="text-sm font-semibold text-white">

                    Notifications

                  </h3>


                  <p className="text-xs text-slate-400">

                    Shipment and operational updates

                  </p>

                </div>


                {unreadCount > 0 && (

                  <button
                    type="button"
                    onClick={
                      handleMarkAllRead
                    }
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >

                    Mark all read

                  </button>

                )}

              </div>


              <div className="max-h-96 overflow-y-auto">


                {notifications.length === 0 ? (

                  <div className="px-6 py-10 text-center">

                    <FaBell
                      className="mx-auto text-slate-600 mb-3"
                      size={22}
                    />


                    <p className="text-sm text-slate-300">

                      No notifications

                    </p>


                    <p className="text-xs text-slate-500 mt-1">

                      New shipment and trip updates will appear here.

                    </p>

                  </div>

                ) : (

                  notifications.map(
                    (
                      notification
                    ) => (

                      <button
                        key={
                          notification.id
                        }
                        type="button"
                        onClick={() =>
                          handleNotificationClick(
                            notification
                          )
                        }
                        className={`w-full text-left px-4 py-3 border-b border-slate-800 hover:bg-slate-800 transition ${
                          notification.is_read
                            ? "bg-slate-900"
                            : "bg-slate-800/70"
                        }`}
                      >

                        <div className="flex gap-3">

                          <div className="mt-0.5 shrink-0">

                            {notification.is_read ? (

                              <FaCheck
                                className="text-slate-500"
                                size={12}
                              />

                            ) : (

                              <span className="block w-2.5 h-2.5 rounded-full bg-blue-400 mt-1" />

                            )}

                          </div>


                          <div className="min-w-0 flex-1">

                            <p className="text-sm font-semibold text-white">

                              {
                                notification.title
                              }

                            </p>


                            <p className="text-xs text-slate-300 mt-1 leading-5">

                              {
                                notification.message
                              }

                            </p>


                            <p className="text-[11px] text-slate-500 mt-2">

                              {
                                formatNotificationTime(
                                  notification.created_at
                                )
                              }

                            </p>

                          </div>

                        </div>

                      </button>

                    )
                  )

                )}

              </div>

            </div>

          )}

        </div>


        {/* ==================================================
            USER
        ================================================== */}

        <div className="flex items-center gap-2">

          <FaUserCircle
            size={34}
            className="text-slate-700"
          />


          <div>

            <p className="font-semibold text-white">

              {userName}

            </p>


            <p className="text-sm text-slate-500">

              {formattedRole}

            </p>

          </div>

        </div>

      </div>

    </header>

  );

}


export default Navbar;