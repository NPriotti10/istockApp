import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function ProtectedLayout() {
  return (
    <>
      
      <div className="app-content">
        <Outlet />
      </div>
    </>
  );
}
