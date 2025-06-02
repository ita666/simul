import { useState } from "react";
import { useWalletStore } from "../store/useWalletStore";
import { useTranslation } from "react-i18next";
import { api } from "../utils/api/api";

export default function Wallet() {
  // Get credits state and actions from store
  const { credits, addCredits } = useWalletStore();
  const { t } = useTranslation();
  
  // Modal state for purchase dialog
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Available credit packs with pricing
  const packs = [
    { id: "micro", credits: 1, price: 0.50, label: "Micro", perCredit: 0.50 },
    { id: "standard", credits: 5, price: 2.00, label: "Standard", perCredit: 0.40 },
    { id: "pro", credits: 10, price: 3.50, label: "Pro", popular: true, perCredit: 0.35 },
    { id: "premium", credits: 30, price: 9.00, label: "Premium", perCredit: 0.30, savings: "40%" }
  ];
  
  // Handle credit pack purchase
  const handlePurchase = async (packId: string, credits: number) => {
    setLoading(true);
    try {
      const response = await api.post("/wallet/buy", {
        mode: "dev", // Change to "prod" when ready
        pack_type: packId
      });
      
      if (response.data.success) {
        addCredits(credits);
        setShowModal(false);
        
        // Track purchase
        await api.post("/track", {
          event: "credits_purchased",
          pack: packId,
          credits: credits,
          timestamp: new Date().toISOString()
        });
      } else if (response.data.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert(t("purchaseError"));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <div className="ml-4 flex items-center gap-2">
        <span className="font-semibold">{t("credits")}:</span>
        <span className="text-lg font-bold text-blue-600">{credits}</span>
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => setShowModal(true)}
        >
          {t("buyCredits")}
        </button>
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Acheter des crédits</h2>
            
            {/* Current balance display */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600">Solde actuel : <span className="font-bold text-lg">{credits} crédits</span></p>
            </div>
            
            <div className="space-y-3">
              {packs.map(pack => (
                <div
                  key={pack.id}
                  className={`border rounded-lg p-4 cursor-pointer hover:border-blue-500 ${
                    pack.popular ? "border-blue-500 bg-blue-50" : ""
                  }`}
                  onClick={() => !loading && handlePurchase(pack.id, pack.credits)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">
                        {pack.label} 
                        {pack.popular && <span className="text-blue-600 text-sm ml-2">⭐ Populaire</span>}
                        {pack.savings && <span className="text-green-600 text-sm ml-2">-{pack.savings}</span>}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {pack.credits} {pack.credits > 1 ? 'crédits' : 'crédit'} • {pack.perCredit.toFixed(2)}€/crédit
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{pack.price.toFixed(2)}€</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 py-2 border rounded hover:bg-gray-50"
                onClick={() => setShowModal(false)}
                disabled={loading}
              >
                {t("cancel")}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4 text-center">
              🔒 Paiement sécurisé • Sans engagement • Crédits valables 1 an
            </p>
            
            {/* Feature costs reminder */}
            <div className="mt-4 pt-4 border-t text-xs text-gray-600">
              <p className="font-semibold mb-1">Rappel des coûts :</p>
              <ul className="space-y-1">
                <li>• Taux variable : 2 crédits</li>
                <li>• Optimisation : 3 crédits</li>
                <li>• Investissement : 3 crédits</li>
                <li>• Test de résistance : 2 crédits</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}