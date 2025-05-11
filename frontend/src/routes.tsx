import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import CreateTemplate from "./pages/Create_template";
import Dashboard from "./pages/Dashboard";
import Template from "./pages/Template";
import TemplatePage from "./pages/Create_template";
import TemplateView from "./pages/TemplateView";
import GarmentTemplate from "./pages/garment-template";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/create_templates" element={<CreateTemplate />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/templates" element={<Template />} />
      <Route path="/templates" element={<TemplatePage />} />
      <Route path="/template/:id" element={<TemplateView />} />
      <Route path="/templates/edit/:id" element={<CreateTemplate />} />
      <Route path="/garment-template" element={<GarmentTemplate />} />
      <Route path="/garment-template/edit/:id" element={<GarmentTemplate />} />
    </Routes>
  );
};

export default AppRoutes;