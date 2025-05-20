import React from "react";
import { NavLink } from "react-router-dom";

const tabs = [
  { label: "Productivity", to: "/dashboard/productivity" },
  { label: "Wellness", to: "/dashboard/wellness" },
  { label: "Analytics", to: "/dashboard/analytics" },
];

const DashboardTabs: React.FC = () => (
  <nav className="flex gap-2 sm:gap-4 border-b border-muted/30 mb-6 mt-2" aria-label="Dashboard Tabs">
    {tabs.map((tab) => (
      <NavLink
        key={tab.to}
        to={tab.to}
        className={({ isActive }) =>
          `relative px-4 py-2 font-[Poppins] text-[15px] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-t-md ` +
          (isActive
            ? "font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400"
            : "text-[#6c757d] hover:text-[#495057]")
        }
      >
        {({ isActive }) => (
          <span className="relative inline-block">
            {tab.label}
            {isActive && (
              <span
                className="absolute left-0 right-0 -bottom-1 h-[3px] rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400"
                aria-hidden="true"
              />
            )}
          </span>
        )}
      </NavLink>
    ))}
  </nav>
);

export default DashboardTabs; 