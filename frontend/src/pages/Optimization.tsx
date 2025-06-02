import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useWalletStore } from "../store/useWalletStore";
import { api } from "../utils/api/api";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Interface for optimization results
interface OptimizationResult {
  optimal: {
    duree: number;
    apport: number;
    apport_pct: number;
    mensualite: number;
    cout_total: number;
    cout_credit: number;
    taux_effort: number;
  };
  alternatives: Array<{
    duree: number;
    apport: number;
    apport_pct: number;
    mensualite: number;
    cout_total: number;
    cout_credit: number;
    taux_effort: number;
  }>;
  credits_required: number;
}

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
  
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Cost in credits for this premium feature
  const CREDIT_COST = 3;
  
  // Handle form submission for optimization calculation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user has enough credits
    if (!hasEnoughCredits(CREDIT_COST)) {
      alert("Vous n'avez pas assez de crédits. Achetez des crédits pour continuer.");
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
      <h1 className="text-2xl font-bold mb-6">Optimisation apport & durée</h1>
      
      {/* Feature description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">🎯 Trouvez la combinaison optimale</h3>
        <p className="text-sm text-blue-800">
          Cette simulation avancée analyse toutes les combinaisons possibles d'apport personnel 
          et de durée de prêt pour minimiser le coût total de votre emprunt tout en respectant 
          votre capacité de remboursement.
        </p>
      </div>
      
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
          
          {/* Visualization chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Visualisation des alternatives</h3>
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="cout_total" 
                    name="Coût total" 
                    label={{ value: 'Coût total (€)', position: 'insideBottom', offset: -5 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    dataKey="mensualite" 
                    name="Mensualité" 
                    label={{ value: 'Mensualité (€)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'cout_total' ? `${value.toLocaleString()} €` : `${value.toLocaleString()} €/mois`,
                      name === 'cout_total' ? 'Coût total' : 'Mensualité'
                    ]}
                    labelFormatter={(index) => {
                      const alt = result?.alternatives[index];
                      return alt ? `${alt.duree / 12} ans - ${alt.apport_pct}% apport` : '';
                    }}
                  />
                  <Scatter name="Solutions" data={result?.alternatives} fill="#3B82F6">
                    {result?.alternatives.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#3B82F6'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-600 text-center mb-6">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Solution optimale
              <span className="inline-block w-3 h-3 bg-blue-500 rounded-full ml-4 mr-2"></span>
              Autres alternatives
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Tableau comparatif détaillé</h3>
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
                    <tr 
                      key={idx} 
                      className={`border-b hover:bg-gray-50 ${
                        idx === 0 ? "bg-green-50 font-medium" : ""
                      }`}
                    >
                      <td className="py-2">{alt.duree / 12} ans</td>
                      <td className="py-2">
                        {alt.apport_pct}% 
                        <span className="text-sm text-gray-600">
                          ({alt.apport.toLocaleString()} €)
                        </span>
                      </td>
                      <td className="py-2">{alt.mensualite.toLocaleString()} €</td>
                      <td className="py-2">
                        {alt.cout_total.toLocaleString()} €
                        <div className="text-xs text-gray-600">
                          Intérêts: {alt.cout_credit.toLocaleString()} €
                        </div>
                      </td>
                      <td className="py-2">
                        <span className={`font-medium ${
                          alt.taux_effort <= 30 ? 'text-green-600' : 
                          alt.taux_effort <= 33 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {alt.taux_effort}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Savings analysis */}
            {result.alternatives.length > 1 && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-2">💰 Analyse des économies</h4>
                <p className="text-sm text-green-800">
                  En choisissant la solution optimale plutôt que la solution la plus coûteuse, 
                  vous économisez <strong>
                    {(Math.max(...result.alternatives.map(a => a.cout_total)) - result.optimal.cout_total).toLocaleString()} €
                  </strong> sur la durée totale du prêt.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}