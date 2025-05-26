import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="text-xl mb-3 font-bold">{t("welcome")}</h1>
      <p>Simulez votre capacité d'emprunt, comparez les taux, accédez à des fonctionnalités premium.</p>
    </div>
  );
}
