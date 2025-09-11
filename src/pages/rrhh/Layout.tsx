
import React from "react";
import SidebarRRHH from "./SidebarRRHH";

export default function RRHHLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <SidebarRRHH />
      <main className="flex-1 ml-64 overflow-auto transition-all duration-300">
        <div className="p-4 md:p-6 lg:p-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
