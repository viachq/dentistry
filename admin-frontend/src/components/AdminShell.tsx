import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import NotificationBell from "./NotificationBell";
import { useState } from "react";

const adminNav = [
  { path: "/", label: "Календар", icon: "📅" },
  { path: "/?tab=appointments", label: "Записи", icon: "📋" },
  { path: "/?tab=finance", label: "Фінанси", icon: "💰" },
  { path: "/?tab=services", label: "Послуги", icon: "🦷" },
  { path: "/?tab=doctors", label: "Лікарі", icon: "👨‍⚕️" },
  { path: "/?tab=promo", label: "Промокоди", icon: "🎫" },
  { path: "/?tab=reviews", label: "Відгуки", icon: "⭐" },
  { path: "/?tab=patients", label: "Пацієнти", icon: "👥" },
  { path: "/?tab=settings", label: "Налаштування", icon: "⚙️" },
];

const doctorNav = [
  { path: "/", label: "Записи", icon: "📋" },
  { path: "/income", label: "Мій дохід", icon: "💰" },
  { path: "/profile", label: "Профіль", icon: "👤" },
  { path: "/reviews", label: "Відгуки", icon: "⭐" },
];

export default function AdminShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = user?.role === "admin" ? adminNav : doctorNav;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-56" : "w-16"} bg-gray-900 text-white flex flex-col transition-all duration-200 flex-shrink-0`}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
          <span className="text-xl">🦷</span>
          {sidebarOpen && (
            <div>
              <p className="font-bold text-sm">DentaCare</p>
              <p className="text-xs text-gray-400">
                {user?.role === "admin" ? "Адміністрація" : "Лікар"}
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path.split("?")[0] &&
              (item.path.includes("?") ? location.search.includes(item.path.split("?")[1]?.split("=")[1] ?? "") : !location.search);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 text-gray-400 hover:text-white text-sm transition-colors ${sidebarOpen ? "w-full" : ""}`}
          >
            <span>🚪</span>
            {sidebarOpen && "Вийти"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="font-semibold text-gray-900 text-sm">
              DentaCare Admin
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user?.full_name?.charAt(0) ?? "U"}
              </div>
              {sidebarOpen && (
                <span className="text-sm text-gray-700">{user?.full_name}</span>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
