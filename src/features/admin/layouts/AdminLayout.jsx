import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/Sidebar/AdminSidebar";
import { SEOHead } from "@/shared";

const AdminLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <SEOHead title="Admin Dashboard" noindex={true} />

      {/* Global Background Effects (Star/Galaxy) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 w-full h-full bg-black">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)] opacity-40 animate-pulse-slow"></div>
        </div>
      </div>

      {/* Sidebar */}
      <AdminSidebar
        collapsed={isSidebarCollapsed}
        setCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Content Area */}
      <main
        className={`relative z-10 transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? "ml-16" : "ml-64"}
          min-h-screen
        `}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
