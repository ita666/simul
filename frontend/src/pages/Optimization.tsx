import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useWalletStore } from "../store/useWalletStore";
import { api } from "../utils/api/api";

export default function Optimization() {
  const { t } = useTranslation();
  const { credits, useCredits, hasEnoughCredits } = useWalletStore();
  
  const [formData, setFormData] = useState({
    salaire: 4000,
    charges: 500,
    prix_bien: 250000,
    taux: 3.5,
    duree_min: 120,
    duree_max: 300
  });
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const CREDIT_COST = 3;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasEnoughCredits(CREDIT_COST)) {
      alert(t("notEnoughCredits"));
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post("/calculate/optimization", formData);
      if (useCredits(CREDIT_COST)) {
        setResult(response.data);
        
        // Track event
        await api.post("/track", {
          event: "optimization_simulation",
          credits_used: CREDIT_COST,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error:", error);
      alert(t("simulationError"));
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t("optimizationSimulation")}</h1>
      
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <p className="text-sm">{t("creditCost")}: <strong>{CREDIT_COST} {t("credits")}</strong></p>
        <p className="text-sm">{t("yourBalance")}: <strong>{credits} {t("credits")}</strong></p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("monthlyIncome")}</label>
            <input
              type="number"
              name="salaire"
              value={formData.salaire}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">{t("monthlyCharges")}</label>
            <input
              type="number"
              name="charges"
              value={formData.charges}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">{t("propertyPrice")}</label>
            <input
              type="number"
              name="prix_bien"
              value={formData.prix_bien}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">{t("interestRate")} (%)</label>
            <input
              type="number"
              step="0.1"
              name="taux"
              value={formData.taux}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">{t("minDuration")} ({t("months")})</label>
            <input
              type="number"
              name="duree_min"
              value={formData.duree_min}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">{t("maxDuration")} ({t("months")})</label>
            <input
              type="number"
              name="duree_max"
              value={formData.duree_max}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading || !hasEnoughCredits(CREDIT_COST)}
          className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? t("calculating") : t("optimize")} ({CREDIT_COST} {t("credits")})
        </button>
      </form>
      
      {result && result.optimal && (
        <div className="mt-8 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">{t("optimalSolution")}</h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-gray-600">{t("duration")}</p>
                <p className="text-xl font-bold">{result.optimal.duree / 12} {t("years")}</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-gray-600">{t("downPayment")}</p>
                <p className="text-xl font-bold">{result.optimal.apport_pct}%</p>
                <p className="text-sm text-gray-600">{result.optimal.apport.toLocaleString()} €</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-gray-600">{t("monthlyPayment")}</p>
                <p className="text-xl font-bold">{result.optimal.mensualite.toLocaleString()} €</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-gray-600">{t("totalCost")}</p>
                <p className="text-xl font-bold">{result.optimal.cout_total.toLocaleString()} €</p>
                <p className="text-sm text-gray-600">{t("creditCost")}: {result.optimal.cout_credit.toLocaleString()} €</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">{t("alternatives")}</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">{t("duration")}</th>
                    <th className="text-left py-2">{t("downPayment")}</th>
                    <th className="text-left py-2">{t("monthlyPayment")}</th>
                    <th className="text-left py-2">{t("totalCost")}</th>
                    <th className="text-left py-2">{t("effortRate")}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.alternatives.map((alt: any, idx: number) => (
                    <tr key={idx} className={idx === 0 ? "bg-green-50" : ""}>
                      <td className="py-2">{alt.duree / 12} {t("years")}</td>
                      <td className="py-2">{alt.apport_pct}% ({alt.apport.toLocaleString()} €)</td>
                      <td className="py-2">{alt.mensualite.toLocaleString()} €</td>
                      <td className="py-2">{alt.cout_total.toLocaleString()} €</td>
                      <td className="py-2">{alt.taux_effort}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}