import { useTranslation } from "react-i18next";
import { Outlet, Link } from "react-router-dom";
import AdsPlaceholder from "./components/AdsPlaceholder";
import Wallet from "./components/Wallet";
import { useEffect } from "react";

export default function App() {
  const { t, i18n } = useTranslation();

  // Microsoft Clarity
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://www.clarity.ms/tag/YOUR-CLARITY-ID";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="flex items-center justify-between px-4 py-2 border-b">
        <div className="text-2xl font-bold">Simulpret</div>
        <nav className="flex gap-3">
          <Link to="/">{t("home")}</Link>
          <Link to="/compare">{t("compare")}</Link>
          <Link to="/premium">{t("premium")}</Link>
        </nav>
        <select
          className="ml-2 border rounded"
          onChange={e => i18n.changeLanguage(e.target.value)}
          value={i18n.language}
        >
          <option value="fr">FR</option>
          <option value="en">EN</option>
        </select>
        <Wallet />
      </header>
      <main className="p-4 max-w-2xl mx-auto">
        <AdsPlaceholder id="top" />
        <Outlet />
        <AdsPlaceholder id="bottom" />
      </main>
    </div>
  );
}
