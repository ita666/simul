import { useState } from 'react';
import { useWalletStore } from '../store/useWalletStore';
import { api } from '../utils/api/api';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

// Interface for stress test results
interface StressTestResult {
  scenarios: Array<{
    scenario: string;
    salaire: number;
    charges: number;
    capacite_paiement: number;
    taux_effort: number;
    viable: boolean;
  }>;
  marge_securite: number;
  risque_global: 'Faible' | 'Moyen' | 'Élevé';
  credits_required: number;
}

export default function StressTest() {
  const { credits, useCredits, hasEnoughCredits } = useWalletStore();
  
  // Form data state
  const [formData, setFormData] = useState({
    salaire: 4000,
    charges: 500,
    mensualite_actuelle: 1200
  });
  
  const [result, setResult] = useState<StressTestResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Cost in credits for this premium feature
  const CREDIT_COST = 2;
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user has enough credits
    if (!hasEnoughCredits(CREDIT_COST)) {
      alert("Vous n'avez pas assez de crédits. Achetez des crédits pour continuer.");
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post("/calculate/stress-test", formData);
      if (useCredits(CREDIT_COST)) {
        setResult(response.data);
        
        // Track event
        await api.post("/track", {
          event: "stress_test_simulation",
          credits_used: CREDIT_COST,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Une erreur est survenue lors de la simulation.");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };
  
  // Get risk color based on risk level
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Faible': return 'text-green-600';
      case 'Moyen': return 'text-orange-600';
      case 'Élevé': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Test de résistance financière
      </h2>
      
      {/* Feature description */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-orange-900 mb-2">🛡️ Anticipez les coups durs</h3>
        <p className="text-sm text-orange-800">
          Testez votre capacité à faire face à différents scénarios de crise : 
          baisse de revenus, perte d'emploi, augmentation des charges... 
          Évaluez votre marge de sécurité avant de vous engager.
        </p>
      </div>
      
      {/* Credits info */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-sm">Coût : <strong>{CREDIT_COST} crédits</strong></p>
        <p className="text-sm">Votre solde : <strong>{credits} crédits</strong></p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Revenus mensuels nets (€)
            </label>
            <input
              type="number"
              name="salaire"
              value={formData.salaire}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Charges mensuelles (€)
            </label>
            <input
              type="number"
              name="charges"
              value={formData.charges}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensualité crédit envisagée (€)
            </label>
            <input
              type="number"
              name="mensualite_actuelle"
              value={formData.mensualite_actuelle}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading || !hasEnoughCredits(CREDIT_COST)}
          className="w-full py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Analyse en cours...' : `Lancer le test de résistance (${CREDIT_COST} crédits)`}
        </button>
      </form>
      
      {result && (
        <div className="mt-8 space-y-6">
          {/* Global risk assessment */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Évaluation globale</h3>
              <span className={`text-2xl font-bold ${getRiskColor(result.risque_global)}`}>
                Risque {result.risque_global}
              </span>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Marge de sécurité</p>
                <div className="flex items-center mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-4 mr-3">
                    <div 
                      className={`h-4 rounded-full ${
                        result.marge_securite > 50 ? 'bg-green-500' :
                        result.marge_securite > 20 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, result.marge_securite))}%` }}
                    />
                  </div>
                  <span className="font-bold">{result.marge_securite}%</span>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Scénarios viables</p>
                <p className="text-2xl font-bold">
                  {result.scenarios.filter(s => s.viable).length} / {result.scenarios.length}
                </p>
              </div>
            </div>
          </div>
          
          {/* Scenarios details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Analyse des scénarios</h3>
            
            {result.scenarios.map((scenario, index) => (
              <div 
                key={index} 
                className={`border rounded-lg p-4 ${
                  scenario.viable ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {scenario.viable ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mr-2" />
                      )}
                      <h4 className="font-semibold">{scenario.scenario}</h4>
                    </div>
                    
                    <div className="grid md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Revenus :</span>
                        <span className="font-medium ml-2">{scenario.salaire.toLocaleString()} €</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Charges :</span>
                        <span className="font-medium ml-2">{scenario.charges.toLocaleString()} €</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Reste à vivre :</span>
                        <span className={`font-medium ml-2 ${
                          scenario.capacite_paiement >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {scenario.capacite_paiement.toLocaleString()} €
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Taux d'effort :</span>
                        <span className={`font-medium ml-2 ${
                          scenario.taux_effort <= 33 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {scenario.taux_effort}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Recommendations */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h4 className="font-semibold mb-3 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-blue-600" />
              Recommandations
            </h4>
            <div className="text-sm text-blue-800 space-y-2">
              {result.marge_securite < 20 ? (
                <>
                  <p>⚠️ <strong>Attention :</strong> Votre marge de sécurité est faible. 
                  Envisagez de réduire votre mensualité ou d'augmenter votre apport.</p>
                  <p>💡 Une épargne de précaution équivalente à 6 mois de mensualités est recommandée.</p>
                </>
              ) : result.marge_securite < 50 ? (
                <>
                  <p>👍 <strong>Correct :</strong> Votre situation permet de faire face aux imprévus courants.</p>
                  <p>💡 Continuez à constituer une épargne de sécurité pour plus de sérénité.</p>
                </>
              ) : (
                <>
                  <p>✅ <strong>Excellent :</strong> Votre marge de sécurité est confortable.</p>
                  <p>💡 Vous pouvez envisager votre projet en toute sérénité.</p>
                </>
              )}
              
              {!result.scenarios.find(s => s.scenario.includes("Chômage"))?.viable && (
                <p>🛡️ Pensez à souscrire une assurance perte d'emploi pour sécuriser votre prêt.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}