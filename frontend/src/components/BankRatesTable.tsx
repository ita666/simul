import { useState, useEffect } from 'react';
import axios from 'axios';

interface BankRate {
  bank_name: string;
  rate_10_years: number;
  rate_15_years: number;
  rate_20_years: number;
  rate_25_years: number;
  best_rate?: boolean;
  last_updated: string;
}

interface RatesResponse {
  rates: BankRate[];
  average_rates: {
    '10_years': number;
    '15_years': number;
    '20_years': number;
    '25_years': number;
  };
  last_update: string;
  next_update?: string;
  status?: string;
}

// Props interface to receive a callback function when a rate is selected
interface BankRatesTableProps {
  onRateSelect?: (rate: number, bankName: string, duration: number) => void;
}

export default function BankRatesTable({ onRateSelect }: BankRatesTableProps) {
  // State to store the bank rates data from API
  const [ratesData, setRatesData] = useState<RatesResponse | null>(null);
  // Loading state for initial data fetch
  const [loading, setLoading] = useState(true);
  // State to track if rates are being updated
  const [updating, setUpdating] = useState(false);
  // Currently selected loan duration for display
  const [selectedDuration, setSelectedDuration] = useState<'10' | '15' | '20' | '25'>('20');

  // Fetch bank rates when component mounts
  useEffect(() => {
    fetchBankRates();
  }, []);

  // Function to fetch bank rates from the backend API
  const fetchBankRates = async () => {
    try {
      const response = await axios.get('http://localhost:8000/bank-rates');
      setRatesData(response.data);
    } catch (error) {
      console.error('Error fetching bank rates:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Force update rates from external sources (web scraping)
  const forceUpdate = async () => {
    setUpdating(true);
    try {
      await axios.post('http://localhost:8000/bank-rates/update');
      // Wait a bit for update to start, then refresh
      setTimeout(() => {
        fetchBankRates();
        setUpdating(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating rates:', error);
      setUpdating(false);
    }
  };

  // Helper function to get the rate for a specific duration from bank data
  const getRateForDuration = (bank: BankRate, duration: string) => {
    switch (duration) {
      case '10': return bank.rate_10_years;
      case '15': return bank.rate_15_years;
      case '20': return bank.rate_20_years;
      case '25': return bank.rate_25_years;
      default: return bank.rate_20_years;
    }
  };

  // Handle when user clicks "Use these rates" button
  const handleUseRate = (bank: BankRate) => {
    const rate = getRateForDuration(bank, selectedDuration);
    const duration = parseInt(selectedDuration);
    
    // Call the parent component's callback if provided
    if (onRateSelect) {
      onRateSelect(rate, bank.bank_name, duration);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!ratesData) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Taux des principales banques
          </h2>
          {ratesData && (
            <p className="text-sm text-gray-500 mt-1">
              Dernière mise à jour : {ratesData.last_update}
              {ratesData.next_update && ` • Prochaine : ${ratesData.next_update}`}
            </p>
          )}
        </div>
        
        <div className="flex gap-2 mt-4 md:mt-0">
          <button
            onClick={forceUpdate}
            disabled={updating}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              updating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {updating ? 'Mise à jour...' : '🔄 Actualiser'}
          </button>
          
          {['10', '15', '20', '25'].map(duration => (
            <button
              key={duration}
              onClick={() => setSelectedDuration(duration as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDuration === duration
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {duration} ans
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">Banque</th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">Taux</th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">Statut</th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {ratesData.rates
              .sort((a, b) => getRateForDuration(a, selectedDuration) - getRateForDuration(b, selectedDuration))
              .map((bank, index) => (
                <tr key={bank.bank_name} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{bank.bank_name}</p>
                      <p className="text-sm text-gray-500">{bank.last_updated}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-lg font-semibold text-gray-900">
                      {getRateForDuration(bank, selectedDuration).toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    {index === 0 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Meilleur taux
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => handleUseRate(bank)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Utiliser ce taux
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Taux moyen du marché :</strong> {ratesData.average_rates[`${selectedDuration}_years` as keyof typeof ratesData.average_rates].toFixed(2)}% 
          pour un prêt sur {selectedDuration} ans
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        <a
          href="#"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          Comparer avec un courtier →
        </a>
        <a
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          Simuler avec ces taux →
        </a>
      </div>
      
      {ratesData?.status === 'updating' && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Info :</strong> Les taux sont en cours de mise à jour automatique...
          </p>
        </div>
      )}
    </div>
  );
}