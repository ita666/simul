import { useTranslation } from "react-i18next";
import { useWalletStore } from "../store/useWalletStore";

export default function Premium() {
  const { t } = useTranslation();
  const { credits, useCredits } = useWalletStore();

  function handlePremiumFeature() {
    if (credits > 0) {
      useCredits(1);
      alert(t("creditUsed"));
    } else {
      alert(t("notEnoughCredits"));
    }
  }

  return (
    <div>
      <h1 className="text-xl mb-3 font-bold">{t("premium")}</h1>
      <button
        className="px-3 py-1 bg-green-500 text-white rounded"
        onClick={handlePremiumFeature}
      >
        {t("advancedSim")}
      </button>
    </div>
  );
}
