import { useWalletStore } from "../store/useWalletStore";
import { useTranslation } from "react-i18next";

export default function Wallet() {
  const { credits, addCredits } = useWalletStore();
  const { t } = useTranslation();
  return (
    <div className="ml-4 flex items-center gap-2">
      <span className="font-semibold">{t("credits")}:</span>
      <span>{credits}</span>
      <button
        className="px-2 py-1 bg-blue-500 text-white rounded"
        onClick={() => addCredits(5)}
      >
        {t("buyCredits")}
      </button>
    </div>
  );
}
