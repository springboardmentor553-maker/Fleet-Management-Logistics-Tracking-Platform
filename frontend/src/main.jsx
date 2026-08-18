import ReactDOM from "react-dom/client";

import App from "./App";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import "react-toastify/dist/ReactToastify.css";

import "leaflet/dist/leaflet.css";

import "./App.css";
import "./index.css";
import "./sidebar-fix.css";


import { ToastContainer } from "react-toastify";


ReactDOM.createRoot(
  document.getElementById("root")
).render(

  <>

    <App />

    <ToastContainer
      position="top-right"
      autoClose={3000}
    />

  </>

);