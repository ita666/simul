import { useTranslation } from "react-i18next";
import { useState } from "react";
import LoanCalculator from "../components/LoanCalculator";
import BankRatesTable from "../components/BankRatesTable";
import AdsPlaceholder from "../components/AdsPlaceholder";

export default function Home() {
  const { t } = useTranslation();
  
  // State to store the selected rate from bank table
  const [selectedRate, setSelectedRate] = useState<{
    rate: number;
    bankName: string;
    duration: number;
  } | null>(null);
  
  // Handle when a bank rate is selected
  const handleRateSelect = (rate: number, bankName: string, duration: number) => {
    setSelectedRate({ rate, bankName, duration });
    // Scroll to calculator smoothly
    const calculatorElement = document.getElementById('loan-calculator');
    if (calculatorElement) {
      calculatorElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Calculez votre capacité d'emprunt instantanément
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Sans inscription, sans email. Découvrez combien vous pouvez emprunter en quelques secondes.
        </p>
      </div>

      <div id="loan-calculator">
        <LoanCalculator selectedRate={selectedRate} />
      </div>
      
      <AdsPlaceholder id="middle-home" />
      
      <BankRatesTable onRateSelect={handleRateSelect} />
      
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">100% Gratuit</h3>
          <p className="text-gray-600">
            Calculez votre capacité d'emprunt sans frais cachés ni inscription
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Taux actualisés</h3>
          <p className="text-gray-600">
            Comparez les taux des principales banques mis à jour quotidiennement
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Confidentialité</h3>
          <p className="text-gray-600">
            Aucune donnée personnelle collectée, calcul 100% anonyme
          </p>
        </div>
      </div>
    </div>
  );
}
