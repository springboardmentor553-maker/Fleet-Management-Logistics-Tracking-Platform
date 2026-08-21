import API from "./api";


// ============================================================
// GET NOTIFICATIONS
// ============================================================

export const getNotifications =
  async () => {

    const response =
      await API.get(
        "/notifications/"
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
        "/notifications/unread-count"
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
        `/notifications/${id}/read`
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
        "/notifications/read-all"
      );

    return response.data;

  };