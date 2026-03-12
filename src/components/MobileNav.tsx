import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, Layers, Bell, ScanBarcode } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Обзор" },
  { to: "/products", icon: Package, label: "Товары" },
  { to: "/batches", icon: Layers, label: "Партии" },
  { to: "/scanner", icon: ScanBarcode, label: "Скан" },
  { to: "/notifications", icon: Bell, label: "Алерты" },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border z-50">
      <div className="flex justify-around py-1.5 px-2 max-w-md mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className="relative flex flex-col items-center gap-0.5 py-1.5 px-3"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute -top-1.5 w-6 h-[3px] rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
