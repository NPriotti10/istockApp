import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function ProtectedLayout() {
  return (
    <>
      <Sidebar />
      <div className="app-content">
        <Outlet />
      </div>
    </>
  );
}
