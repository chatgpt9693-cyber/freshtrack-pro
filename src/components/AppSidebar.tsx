import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, Layers, Bell, Settings, ScanBarcode } from "lucide-react";

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
    <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border min-h-screen">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-primary-foreground flex items-center gap-2">
          <span className="font-mono text-sidebar-primary">FT</span>
          <span className="text-sidebar-foreground">FreshTrack</span>
        </h1>
        <p className="text-xs text-sidebar-foreground/50 mt-1">Контроль сроков годности</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/40 font-mono">v0.1.0 MVP</div>
      </div>
    </aside>
  );
}
