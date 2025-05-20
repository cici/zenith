import React from "react";
import { Loader2 } from "lucide-react";

const DashboardLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full w-full py-16" role="status" aria-label="Loading dashboard">
    <span className="relative inline-flex items-center justify-center">
      <Loader2
        className="h-14 w-14 animate-spin"
        style={{
          stroke: "url(#zenith-gradient)",
        }}
      />
      <svg width="0" height="0">
        <linearGradient id="zenith-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a259ff" />
          <stop offset="50%" stopColor="#377dff" />
          <stop offset="100%" stopColor="#43e7ad" />
        </linearGradient>
      </svg>
    </span>
    <span className="mt-4 text-base font-medium text-gray-500 font-[Poppins] tracking-wide">Loading dashboard...</span>
  </div>
);

export default DashboardLoader; 