import React from "react";
import ReactDOM from "react-dom/client";
import App from "./pages/create_template","login","dashboard","home","register","forgot_password","reset_password","profile","settings","not_found","error";

import "bootstrap/dist/css/bootstrap.min.css";
import "font-awesome/css/font-awesome.min.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);