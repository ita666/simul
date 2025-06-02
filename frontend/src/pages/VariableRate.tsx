import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useWalletStore } from "../store/useWalletStore";
import { api } from "../utils/api/api";

export default function VariableRate() {
  const { t } = useTranslation();
  const { credits, useCredits, hasEnoughCredits } = useWalletStore();
  
  const [formData, setFormData] = useState({
    salaire: 4000,
    charges: 500,
    taux_initial: 3.5,
    duree: 240,
    periode_fixe: 60,
    variation_annuelle: 0.2
  });
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const CREDIT_COST = 2;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasEnoughCredits(CREDIT_COST)) {
      alert(t("notEnoughCredits"));
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post("/calculate/variable-rate", formData);
      if (useCredits(CREDIT_COST)) {
        setResult(response.data);
        
        // Track event
        await api.post("/track", {
          event: "variable_rate_simulation",
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
      <h1 className="text-2xl font-bold mb-6">{t("variableRateSimulation")}</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
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
            <label className="block text-sm font-medium mb-1">{t("initialRate")} (%)</label>
            <input
              type="number"
              step="0.1"
              name="taux_initial"
              value={formData.taux_initial}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">{t("loanDuration")} ({t("months")})</label>
            <input
              type="number"
              name="duree"
              value={formData.duree}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">{t("fixedPeriod")} ({t("months")})</label>
            <input
              type="number"
              name="periode_fixe"
              value={formData.periode_fixe}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">{t("annualVariation")} (%)</label>
            <input
              type="number"
              step="0.1"
              name="variation_annuelle"
              value={formData.variation_annuelle}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading || !hasEnoughCredits(CREDIT_COST)}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? t("calculating") : t("simulate")} ({CREDIT_COST} {t("credits")})
        </button>
      </form>
      
      {result && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">{t("simulationResults")}</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">{t("initialAmount")}</p>
              <p className="text-2xl font-bold">{result.montant_initial.toLocaleString()} €</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">{t("initialMonthly")}</p>
              <p className="text-2xl font-bold">{result.mensualite_initiale.toLocaleString()} €</p>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold mb-3">{t("rateProjections")}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">{t("year")}</th>
                  <th className="text-left py-2">{t("rate")}</th>
                  <th className="text-left py-2">{t("monthlyPayment")}</th>
                  <th className="text-left py-2">{t("remainingCapital")}</th>
                </tr>
              </thead>
              <tbody>
                {result.projections.map((proj: any, index: number) => (
                  <tr key={proj.annee} className="border-b hover:bg-gray-50">
                    <td className="py-2">Année {proj.annee}</td>
                    <td className="py-2">
                      <span className={`font-medium ${
                        index === 0 ? 'text-green-600' : 
                        proj.taux > formData.taux_initial ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {proj.taux}%
                      </span>
                    </td>
                    <td className="py-2">
                      <span className={`font-medium ${
                        proj.mensualite > result.mensualite_initiale ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {proj.mensualite.toLocaleString()} €
                      </span>
                      {proj.mensualite > result.mensualite_initiale && (
                        <span className="text-xs text-red-600 ml-2">
                          (+{((proj.mensualite - result.mensualite_initiale) / result.mensualite_initiale * 100).toFixed(1)}%)
                        </span>
                      )}
                    </td>
                    <td className="py-2">{proj.capital_restant.toLocaleString()} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Summary statistics */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">Résumé de l'impact</h4>
            <p className="text-sm text-blue-800">
              Sur la durée du prêt, votre mensualité pourrait varier de 
              <strong> {result.mensualite_initiale.toLocaleString()} €</strong> à 
              <strong> {Math.max(...result.projections.map(p => p.mensualite)).toLocaleString()} €</strong>
              {result.projections.length > 0 && (
                <span>
                  , soit une augmentation maximale de 
                  <strong> {((Math.max(...result.projections.map(p => p.mensualite)) - result.mensualite_initiale) / result.mensualite_initiale * 100).toFixed(1)}%</strong>.
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}