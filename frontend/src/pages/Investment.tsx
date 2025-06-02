import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useWalletStore } from "../store/useWalletStore";
import { api } from "../utils/api/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Interface for investment simulation results
interface InvestmentResult {
  mensualite: number;
  cash_flow_mensuel: number;
  rentabilite_brute: number;
  projections: Array<{
    annees: number;
    cash_flow_cumule: number;
    capital_rembourse: number;
    rendement_brut: number;
    rendement_net: number;
  }>;
  credits_required: number;
}

export default function Investment() {
  const { t } = useTranslation();
  const { credits, useCredits, hasEnoughCredits } = useWalletStore();
  
  const [formData, setFormData] = useState({
    prix_bien: 200000,
    apport: 40000,
    taux: 3.8,
    duree: 240,
    loyer_mensuel: 1200,
    charges_mensuelles: 200,
    impots_annuels: 2400
  });
  
  const [result, setResult] = useState<InvestmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Cost in credits for this premium feature
  const CREDIT_COST = 3;
  
  // Handle form submission for investment calculation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user has enough credits
    if (!hasEnoughCredits(CREDIT_COST)) {
      alert("Vous n'avez pas assez de crédits. Achetez des crédits pour continuer.");
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post("/calculate/investment", formData);
      if (useCredits(CREDIT_COST)) {
        setResult(response.data);
        
        // Track event
        await api.post("/track", {
          event: "investment_simulation",
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
      <h1 className="text-2xl font-bold mb-6">Simulation investissement locatif</h1>
      
      {/* Feature description */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-purple-900 mb-2">🏢 Analysez votre investissement locatif</h3>
        <p className="text-sm text-purple-800">
          Simulez la rentabilité de votre investissement locatif en prenant en compte 
          les loyers, charges, impôts et l'évolution du capital. Obtenez des projections 
          sur 5, 10, 15 et 20 ans avec calcul du cash-flow et du rendement net.
        </p>
      </div>
      
      <div className="bg-purple-50 p-4 rounded-lg mb-6">
        <p className="text-sm">{t("creditCost")}: <strong>{CREDIT_COST} {t("credits")}</strong></p>
        <p className="text-sm">{t("yourBalance")}: <strong>{credits} {t("credits")}</strong></p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium mb-1">{t("downPayment")}</label>
            <input
              type="number"
              name="apport"
              value={formData.apport}
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
            <label className="block text-sm font-medium mb-1">{t("monthlyRent")}</label>
            <input
              type="number"
              name="loyer_mensuel"
              value={formData.loyer_mensuel}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">{t("monthlyExpenses")}</label>
            <input
              type="number"
              name="charges_mensuelles"
              value={formData.charges_mensuelles}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">{t("annualTaxes")}</label>
            <input
              type="number"
              name="impots_annuels"
              value={formData.impots_annuels}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading || !hasEnoughCredits(CREDIT_COST)}
          className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400"
        >
          {loading ? t("calculating") : t("simulate")} ({CREDIT_COST} {t("credits")})
        </button>
      </form>
      
      {result && (
        <div className="mt-8 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">{t("investmentAnalysis")}</h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-sm text-gray-600">{t("monthlyPayment")}</p>
                <p className="text-xl font-bold">{result.mensualite.toLocaleString()} €</p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-sm text-gray-600">{t("monthlyCashFlow")}</p>
                <p className={`text-xl font-bold ${result.cash_flow_mensuel >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.cash_flow_mensuel >= 0 ? '+' : ''}{result.cash_flow_mensuel.toLocaleString()} €
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-sm text-gray-600">{t("grossReturn")}</p>
                <p className="text-xl font-bold">{result.rentabilite_brute}%</p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-sm text-gray-600">{t("netReturn")}</p>
                <p className="text-xl font-bold">{result.projections[0]?.rendement_net || 0}%</p>
              </div>
            </div>
          </div>
          
          {/* Cash flow visualization */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Evolution du cash-flow cumulé</h3>
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.projections}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="annees" 
                    label={{ value: 'Années', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: 'Montant (€)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => `${value.toLocaleString()} €`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="cash_flow_cumule" 
                    fill="#8B5CF6" 
                    name="Cash-flow cumulé"
                  />
                  <Bar 
                    dataKey="capital_rembourse" 
                    fill="#10B981" 
                    name="Capital remboursé"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Projections détaillées</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">{t("period")}</th>
                    <th className="text-left py-2">{t("cumulativeCashFlow")}</th>
                    <th className="text-left py-2">{t("capitalRepaid")}</th>
                    <th className="text-left py-2">{t("grossReturn")}</th>
                    <th className="text-left py-2">{t("netReturn")}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.projections.map((proj: any) => (
                    <tr key={proj.annees} className="border-b hover:bg-gray-50">
                      <td className="py-2 font-medium">{proj.annees} ans</td>
                      <td className={`py-2 font-medium ${proj.cash_flow_cumule >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {proj.cash_flow_cumule >= 0 ? '+' : ''}{proj.cash_flow_cumule.toLocaleString()} €
                      </td>
                      <td className="py-2">{proj.capital_rembourse.toLocaleString()} €</td>
                      <td className="py-2">
                        <span className={`font-medium ${
                          proj.rendement_brut >= 5 ? 'text-green-600' : 
                          proj.rendement_brut >= 3 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {proj.rendement_brut}%
                        </span>
                      </td>
                      <td className="py-2">
                        <span className={`font-medium ${
                          proj.rendement_net >= 3 ? 'text-green-600' : 
                          proj.rendement_net >= 1 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {proj.rendement_net}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Investment advice */}
            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold mb-2">💡 Analyse de rentabilité</h4>
              <div className="text-sm text-purple-800 space-y-2">
                {result.rentabilite_brute >= 5 ? (
                  <p>✅ <strong>Excellent :</strong> Avec {result.rentabilite_brute}% de rendement brut, 
                  cet investissement présente une rentabilité supérieure à la moyenne du marché.</p>
                ) : result.rentabilite_brute >= 3 ? (
                  <p>✔️ <strong>Correct :</strong> Avec {result.rentabilite_brute}% de rendement brut, 
                  cet investissement offre une rentabilité dans la moyenne.</p>
                ) : (
                  <p>⚠️ <strong>Attention :</strong> Avec {result.rentabilite_brute}% de rendement brut, 
                  la rentabilité est faible. Vérifiez vos hypothèses de loyer et de charges.</p>
                )}
                
                {result.cash_flow_mensuel >= 0 ? (
                  <p>✅ Le cash-flow positif de {result.cash_flow_mensuel.toLocaleString()} €/mois 
                  permet l'autofinancement de l'investissement.</p>
                ) : (
                  <p>⚠️ Le cash-flow négatif de {Math.abs(result.cash_flow_mensuel).toLocaleString()} €/mois 
                  nécessite un effort d'épargne mensuel.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}