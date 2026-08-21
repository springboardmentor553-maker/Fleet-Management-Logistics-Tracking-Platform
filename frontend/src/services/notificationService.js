import axios from "axios";


const API = axios.create({

  baseURL:
    "http://127.0.0.1:8000",

});


const getAuthHeaders = () => {

  const token =
    localStorage.getItem(
      "token"
    );


  return {

    Authorization:
      `Bearer ${token}`,

  };

};


// ============================================================
// GET NOTIFICATIONS
// ============================================================

export const getNotifications =
  async () => {

    const response =
      await API.get(

        "/notifications/",

        {
          headers:
            getAuthHeaders(),
        }

      );


    return response.data;

  };


// ============================================================
// GET UNREAD COUNT
// ============================================================

export const getUnreadNotificationCount =
  async () => {

    const response =
      await API.get(

        "/notifications/unread-count",

        {
          headers:
            getAuthHeaders(),
        }

      );


    return response.data.count || 0;

  };


// ============================================================
// MARK ONE READ
// ============================================================

export const markNotificationRead =
  async (id) => {

    const response =
      await API.put(

        `/notifications/${id}/read`,

        {},

        {
          headers:
            getAuthHeaders(),
        }

      );


    return response.data;

  };


// ============================================================
// MARK ALL READ
// ============================================================

export const markAllNotificationsRead =
  async () => {

    const response =
      await API.put(

        "/notifications/read-all",

        {},

        {
          headers:
            getAuthHeaders(),
        }

      );


    return response.data;

  };