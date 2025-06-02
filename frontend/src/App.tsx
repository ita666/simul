import { useTranslation } from "react-i18next";
import { Outlet, Link, useLocation } from "react-router-dom";
import AdsPlaceholder from "./components/AdsPlaceholder";
import Wallet from "./components/Wallet";
import { useEffect } from "react";

export default function App() {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  // Microsoft Clarity
  useEffect(() => {
    const script = document.createElement('script');
    script.innerHTML = `
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "YOUR-CLARITY-ID");
    `;
    document.head.appendChild(script);
  }, []);
  
  // Check payment success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      alert(t("paymentSuccess"));
      window.history.replaceState({}, '', '/');
    }
  }, [t]);

  const navLinks = [
    { path: "/", label: "Calculateur" },
    { path: "/compare", label: "Comparateur de taux" },
    { path: "/optimization", label: "Optimisation" },
    { path: "/premium", label: "Premium" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-2xl font-bold text-blue-600">
                Simulpret
              </Link>
              <nav className="hidden md:flex gap-6">
                {navLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                      location.pathname === link.path ? "text-blue-600" : "text-gray-700"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <select
                className="border rounded px-2 py-1 text-sm"
                onChange={e => i18n.changeLanguage(e.target.value)}
                value={i18n.language}
              >
                <option value="fr">🇫🇷 FR</option>
                <option value="en">🇬🇧 EN</option>
              </select>
              <Wallet />
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <AdsPlaceholder id="top" />
        <Outlet />
        <AdsPlaceholder id="bottom" />
      </main>
      
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">© 2024 Simulpret - {t("allRightsReserved")}</p>
        </div>
      </footer>
    </div>
  );
}