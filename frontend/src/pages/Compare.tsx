import { useTranslation } from "react-i18next";

export default function Compare() {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="text-xl mb-3 font-bold">{t("compare")}</h1>
      <p>Ici tu pourras comparer les taux des banques (démo à personnaliser).</p>
    </div>
  );
}
