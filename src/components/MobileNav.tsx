import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, Layers, Bell, ScanBarcode } from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Дашборд" },
  { to: "/products", icon: Package, label: "Товары" },
  { to: "/batches", icon: Layers, label: "Партии" },
  { to: "/scanner", icon: ScanBarcode, label: "Скан" },
  { to: "/notifications", icon: Bell, label: "Алерты" },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around py-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors ${
                isActive ? "text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
