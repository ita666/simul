import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface LoanResult {
  montant: number;
  mensualite_max: number;
  cout_total: number;
  cout_credit: number;
  revenu_total: number;
  taux_effort_utilise: number;
  error?: string;
}

// Props interface to receive selected rate from bank table
interface LoanCalculatorProps {
  selectedRate?: {
    rate: number;
    bankName: string;
    duration: number;
  } | null;
}

export default function LoanCalculator({ selectedRate }: LoanCalculatorProps) {
  const { t } = useTranslation();
  
  // Initialize form data with state
  const [formData, setFormData] = useState({
    salaire: '',
    autres_revenus: '',
    charges: '',
    taux: '3.5',
    duree: '240',
    taux_effort_max: '0.33'
  });
  const [result, setResult] = useState<LoanResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  // State to show notification when rate is applied
  const [showRateNotification, setShowRateNotification] = useState(false);
  
  // Update form when a bank rate is selected
  useEffect(() => {
    if (selectedRate) {
      // Update the rate and duration based on selection
      const durationInMonths = selectedRate.duration * 12;
      setFormData(prev => ({
        ...prev,
        taux: selectedRate.rate.toString(),
        duree: durationInMonths.toString()
      }));
      
      // Show notification
      setShowRateNotification(true);
      setTimeout(() => setShowRateNotification(false), 5000);
    }
  }, [selectedRate]);

  const durations = [
    { value: 120, label: '10 ans' },
    { value: 180, label: '15 ans' },
    { value: 240, label: '20 ans' },
    { value: 300, label: '25 ans' }
  ];

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:8000/calculate', {
        salaire: parseFloat(formData.salaire) || 0,
        autres_revenus: parseFloat(formData.autres_revenus) || 0,
        charges: parseFloat(formData.charges) || 0,
        taux: parseFloat(formData.taux),
        duree: parseInt(formData.duree),
        taux_effort_max: parseFloat(formData.taux_effort_max)
      });
      
      setResult(response.data);
    } catch (error) {
      console.error('Error calculating loan:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Calculez votre capacité d'emprunt</h2>
        
        {/* Notification when rate is applied from bank table */}
        {showRateNotification && selectedRate && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              ✓ Taux de <strong>{selectedRate.bankName}</strong> appliqué : 
              <strong> {selectedRate.rate}%</strong> sur <strong>{selectedRate.duration} ans</strong>
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salaire mensuel net (€)
              </label>
              <input
                type="number"
                name="salaire"
                value={formData.salaire}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="2500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Autres revenus réguliers (€)
              </label>
              <input
                type="number"
                name="autres_revenus"
                value={formData.autres_revenus}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="500"
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
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="800"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée du prêt
              </label>
              <select
                name="duree"
                value={formData.duree}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {durations.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taux d'intérêt (%)
                {selectedRate && (
                  <span className="text-xs text-green-600 ml-2">
                    (Taux {selectedRate.bankName})
                  </span>
                )}
              </label>
              <input
                type="number"
                name="taux"
                value={formData.taux}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                max="10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taux d'effort maximum (%)
              </label>
              <select
                name="taux_effort_max"
                value={formData.taux_effort_max}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="0.30">30%</option>
                <option value="0.33">33% (recommandé)</option>
                <option value="0.35">35%</option>
              </select>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Calcul en cours...' : 'Calculer ma capacité d\'emprunt'}
          </button>
        </form>
        
        {result && (
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            {result.error ? (
              <div className="text-red-600 font-medium">{result.error}</div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Résultats de votre simulation</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Capacité d'emprunt</p>
                    <p className="text-2xl font-bold text-blue-600">{result.montant.toLocaleString('fr-FR')} €</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Mensualité maximale</p>
                    <p className="text-2xl font-bold text-green-600">{result.mensualite_max.toLocaleString('fr-FR')} €</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Coût total du crédit</p>
                    <p className="text-xl font-semibold text-gray-700">{result.cout_credit.toLocaleString('fr-FR')} €</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Montant total à rembourser</p>
                    <p className="text-xl font-semibold text-gray-700">{result.cout_total.toLocaleString('fr-FR')} €</p>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Information :</strong> Avec un revenu total de {result.revenu_total.toLocaleString('fr-FR')} € 
                    et un taux d'effort de {(result.taux_effort_utilise * 100).toFixed(0)}%, 
                    vous pouvez emprunter jusqu'à {result.montant.toLocaleString('fr-FR')} €.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}