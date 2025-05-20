import React from "react";
import { useLocation, Link } from "react-router-dom";
import { ROUTES } from "@/routes/routes";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

const PATH_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  analytics: "Analytics",
  profile: "Profile",
  // Add more as needed
};

const DynamicBreadcrumbs: React.FC = () => {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb className="px-5 pt-4 pb-2">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild href={ROUTES.ROOT} aria-label="Home">
            <Link to={ROUTES.ROOT}>
              <Home className="w-4 h-4 text-[#adb5bd]" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((seg, idx) => {
          const isLast = idx === segments.length - 1;
          const path = "/" + segments.slice(0, idx + 1).join("/");
          const label = PATH_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);

          return (
            <React.Fragment key={seg}>
              <BreadcrumbSeparator>
                <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 w-1 h-4 rounded-full inline-block" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="font-[Poppins] text-[12.5px] font-semibold bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild href={path} className="text-[#6c757d] hover:text-[#495057] font-[Poppins] text-[12.5px]">
                    <Link to={path}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default DynamicBreadcrumbs; 