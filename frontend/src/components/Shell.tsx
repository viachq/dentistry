import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import NotificationBell from "./NotificationBell";
import SocialLinks from "./SocialLinks";
import type { ClinicSettings } from "../shared/types";
import { api } from "../shared/api";

export default function Shell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    api.get<ClinicSettings>("/clinic-settings").then((r) => setSettings(r.data)).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky wrapper: topbar + header together */}
      <div className="sticky top-0 z-40">
      {/* Topbar */}
      <div className="bg-gray-950 text-sm">
        <div className="max-w-6xl mx-auto px-4 h-10 flex items-center justify-between">
          <div className="flex items-center gap-5">
            {settings?.phone && (
              <a href={`tel:${settings.phone}`} className="flex items-center gap-1.5 text-white font-medium hover:text-blue-300 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                {settings.phone}
              </a>
            )}
            {settings?.working_hours_note && (
              <span className="hidden sm:block text-gray-400 font-medium border-l border-gray-800 pl-5">
                {settings.working_hours_note}
              </span>
            )}
          </div>
          {settings && <SocialLinks settings={settings} iconClassName="w-3.5 h-3.5" />}
        </div>
      </div>

      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <svg className="w-9 h-9 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5c-1 .02-4-1.34-6.36.71C4.03 7.1 3.37 9.4 4.16 12.43c.54 2.1 1.36 3.75 2.64 4.68.7.67.55 2.6 1.2 3.39C9 22 11 20.5 12 19.5c1 1 3 2.5 4 1 .65-.8.5-2.72 1.2-3.39 1.28-.93 2.1-2.58 2.64-4.68.78-3.03.12-5.33-1.48-6.72C16.98 3.66 13 5.02 12 5z"/>
            </svg>
            <span className="font-bold text-xl text-gray-900 tracking-tight">DentaCare</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link to="/" className="hover:text-blue-600 transition-colors">Головна</Link>
            <Link to="/about" className="hover:text-blue-600 transition-colors">Про нас</Link>
            <Link to="/prices" className="hover:text-blue-600 transition-colors">Ціни</Link>
            <Link to="/team" className="hover:text-blue-600 transition-colors">Лікарі</Link>
            <Link to="/#contacts" className="hover:text-blue-600 transition-colors">Контакти</Link>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <NotificationBell />
                <Link to="/patient" className="text-sm font-medium text-blue-600 hover:underline hidden sm:inline">
                  {user.full_name}
                </Link>
                <button onClick={handleLogout} className="btn-secondary text-sm py-1.5 hidden sm:inline-flex">
                  Вийти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm py-1.5 hidden sm:inline-flex">Увійти</Link>
                <Link to="/login?tab=register" className="btn-primary text-sm py-1.5 hidden sm:inline-flex">Реєстрація</Link>
              </>
            )}
            {/* Hamburger button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-blue-600 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1">
            <Link to="/" className="block py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>Головна</Link>
            <Link to="/about" className="block py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>Про нас</Link>
            <Link to="/prices" className="block py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>Ціни</Link>
            <Link to="/team" className="block py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>Лікарі</Link>
            <Link to="/#contacts" className="block py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>Контакти</Link>
            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
              {user ? (
                <>
                  <Link to="/patient" className="text-sm font-medium text-blue-600 hover:underline py-1" onClick={() => setMobileMenuOpen(false)}>
                    {user.full_name}
                  </Link>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="btn-secondary text-sm py-1.5 w-full">
                    Вийти
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary text-sm py-1.5 text-center" onClick={() => setMobileMenuOpen(false)}>Увійти</Link>
                  <Link to="/login?tab=register" className="btn-primary text-sm py-1.5 text-center" onClick={() => setMobileMenuOpen(false)}>Реєстрація</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
      </div>{/* end sticky wrapper */}

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-950 text-gray-400 text-sm">
        {/* Top gradient accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-blue-600 to-transparent" />

        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <svg className="w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5c-1 .02-4-1.34-6.36.71C4.03 7.1 3.37 9.4 4.16 12.43c.54 2.1 1.36 3.75 2.64 4.68.7.67.55 2.6 1.2 3.39C9 22 11 20.5 12 19.5c1 1 3 2.5 4 1 .65-.8.5-2.72 1.2-3.39 1.28-.93 2.1-2.58 2.64-4.68.78-3.03.12-5.33-1.48-6.72C16.98 3.66 13 5.02 12 5z"/>
              </svg>
              <span className="font-bold text-white text-lg">DentaCare</span>
            </Link>
            <p className="text-gray-500 text-xs leading-relaxed">
              {settings?.tagline ?? "Сучасна стоматологічна клініка в Києві"}
            </p>
            {settings && (
              <div className="mt-4">
                <SocialLinks settings={settings} iconClassName="w-5 h-5" />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-600 mb-3">Навігація</p>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-white transition-colors">Головна</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Про нас</Link></li>
              <li><Link to="/prices" className="hover:text-white transition-colors">Ціни</Link></li>
              <li><Link to="/team" className="hover:text-white transition-colors">Лікарі</Link></li>
              <li><Link to="/#contacts" className="hover:text-white transition-colors">Контакти</Link></li>
            </ul>
          </div>

          {/* For patients */}
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-600 mb-3">Для пацієнтів</p>
            <ul className="space-y-2">
              <li><Link to="/login?tab=register" className="hover:text-white transition-colors">Запис на прийом</Link></li>
              <li><Link to="/#testimonials" className="hover:text-white transition-colors">Відгуки</Link></li>
              <li><Link to="/#faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-600 mb-3">Контакти</p>
            <ul className="space-y-2">
              {settings?.address && <li className="text-gray-400">{settings.address}</li>}
              {settings?.phone && (
                <li>
                  <a href={`tel:${settings.phone}`} className="hover:text-white transition-colors">{settings.phone}</a>
                </li>
              )}
              {settings?.email && (
                <li>
                  <a href={`mailto:${settings.email}`} className="hover:text-white transition-colors">{settings.email}</a>
                </li>
              )}
              {settings?.working_hours_note && <li className="text-gray-500 text-xs">{settings.working_hours_note}</li>}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>&copy; {new Date().getFullYear()} DentaCare. Всі права захищені.</span>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Нагору
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
