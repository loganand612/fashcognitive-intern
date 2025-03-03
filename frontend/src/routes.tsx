import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import CreateTemplate from "./pages/Create_template";  


const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/create_templates" element={<CreateTemplate />} />
    </Routes>
  );
};

export default AppRoutes;
