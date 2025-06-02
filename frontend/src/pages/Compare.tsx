import { useTranslation } from "react-i18next";
import { useState } from "react";
import BankRatesTable from "../components/BankRatesTable";
import AdsPlaceholder from "../components/AdsPlaceholder";
import StressTest from "../components/StressTest";
import MultiOfferComparison from "../components/MultiOfferComparison";
import RateAlerts from "../components/RateAlerts";

export default function Compare() {
  const { t } = useTranslation();
  
  // State to store selected rate from bank table
  const [selectedRate, setSelectedRate] = useState<{
    rate: number;
    bankName: string;
    duration: number;
  } | null>(null);
  
  // Handle when a bank rate is selected
  const handleRateSelect = (rate: number, bankName: string, duration: number) => {
    setSelectedRate({ rate, bankName, duration });
  };
  
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Comparateur de taux bancaires
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Découvrez les meilleurs taux du marché actualisés en temps réel
        </p>
      </div>

      <BankRatesTable onRateSelect={handleRateSelect} />
      
      <AdsPlaceholder id="compare-middle" />
      
      {/* Multi-Offer Comparison Component */}
      <MultiOfferComparison />
      
      {/* Stress Test Component */}
      <StressTest />
      
      {/* Rate Alerts Component */}
      <RateAlerts />
      
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Comment obtenir le meilleur taux ?
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Comparez les offres</h3>
            <p className="text-gray-600">
              Les taux varient significativement entre les banques. Une différence de 0,5% 
              peut représenter plusieurs milliers d'euros sur la durée du prêt.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Négociez avec votre banque</h3>
            <p className="text-gray-600">
              Utilisez notre comparateur pour obtenir des arguments de négociation 
              et faire jouer la concurrence.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Faites appel à un courtier</h3>
            <p className="text-gray-600">
              Un courtier peut négocier pour vous et accéder à des taux préférentiels 
              non disponibles en direct.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Optimisez votre dossier</h3>
            <p className="text-gray-600">
              Un apport conséquent, des revenus stables et un taux d'endettement 
              faible vous permettront d'obtenir les meilleures conditions.
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex flex-wrap gap-4">
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Calculer ma capacité d'emprunt →
          </a>
          <a
            href="#"
            className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Contacter un courtier →
          </a>
        </div>
      </div>
    </div>
  );
}
