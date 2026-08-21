import {
  StrictMode,
} from "react";

import {
  createRoot,
} from "react-dom/client";

import "./index.css";

import App from "./App.jsx";

import {
  registerPushNotifications,
} from "./services/pushNotificationService";


createRoot(
  document.getElementById("root")
).render(

  <StrictMode>

    <App />

  </StrictMode>

);


if (
  localStorage.getItem("token")
) {

  registerPushNotifications();

}