import React from "react";
import ReactDOM from "react-dom/client";
import App from "./pages/create_template";
import "bootstrap/dist/css/bootstrap.min.css";
import "font-awesome/css/font-awesome.min.css";
import "./styles/login.css";
import "./styles/create_template.css";
import "./styles/index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);