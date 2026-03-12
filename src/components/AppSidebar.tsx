import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, Layers, Bell, Settings, ScanBarcode, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Дашборд" },
  { to: "/products", icon: Package, label: "Продукты" },
  { to: "/batches", icon: Layers, label: "Партии" },
  { to: "/notifications", icon: Bell, label: "Уведомления" },
  { to: "/scanner", icon: ScanBarcode, label: "Сканер" },
  { to: "/settings", icon: Settings, label: "Настройки" },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-[260px] bg-sidebar min-h-screen border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-5 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-mono font-bold text-sm">FT</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-sidebar-accent-foreground tracking-tight">FreshTrack</h1>
            <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-widest">Shelf life control</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/30 px-3 pb-2 pt-1">Навигация</p>
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className="relative block"
            >
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-primary/15 text-sidebar-primary"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 w-[3px] h-5 rounded-r-full bg-sidebar-primary top-1/2 -translate-y-1/2"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="w-[18px] h-[18px]" />
                {label}
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 mx-3 mb-3 rounded-lg bg-sidebar-accent/30 border border-sidebar-border/50">
        <p className="text-[10px] text-sidebar-foreground/30 uppercase tracking-wider">Версия</p>
        <p className="text-xs text-sidebar-foreground/60 font-mono mt-0.5">0.1.0 — MVP</p>
      </div>
    </aside>
  );
}
