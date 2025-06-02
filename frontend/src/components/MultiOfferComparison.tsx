import { useState } from "react";
import { PlusIcon, TrashIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useWalletStore } from "../store/useWalletStore";

interface BankOffer {
  id: string;
  bank_name: string;
  taux: number;
  duree: number;
  frais_dossier: number;
  assurance_mensuelle: number;
  taux_assurance: number;
}

interface ComparisonResult {
  bank_name: string;
  mensualite_credit: number;
  assurance_mensuelle: number;
  mensualite_totale: number;
  frais_dossier: number;
  cout_total: number;
  cout_credit: number;
  taux: number;
  duree: number;
  economie?: number;
}

interface MultiOfferComparisonProps {
  prixBien?: number;
  apport?: number;
}

export default function MultiOfferComparison({ prixBien = 300000, apport = 30000 }: MultiOfferComparisonProps) {
  const { credits, useCredits } = useWalletStore();
  const [offers, setOffers] = useState<BankOffer[]>([
    {
      id: "1",
      bank_name: "Crédit Agricole",
      taux: 3.2,
      duree: 240,
      frais_dossier: 1000,
      assurance_mensuelle: 0,
      taux_assurance: 0.35
    }
  ]);
  
  const [newOffer, setNewOffer] = useState<BankOffer>({
    id: "",
    bank_name: "",
    taux: 3.5,
    duree: 240,
    frais_dossier: 1000,
    assurance_mensuelle: 0,
    taux_assurance: 0.35
  });
  
  const [results, setResults] = useState<ComparisonResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [montantEmprunte, setMontantEmprunte] = useState(0);

  const addOffer = () => {
    if (!newOffer.bank_name) {
      setError("Veuillez entrer le nom de la banque");
      return;
    }
    
    setOffers([...offers, { ...newOffer, id: Date.now().toString() }]);
    setNewOffer({
      id: "",
      bank_name: "",
      taux: 3.5,
      duree: 240,
      frais_dossier: 1000,
      assurance_mensuelle: 0,
      taux_assurance: 0.35
    });
  };

  const removeOffer = (id: string) => {
    setOffers(offers.filter(offer => offer.id !== id));
  };

  const compareOffers = async () => {
    if (offers.length < 2) {
      setError("Ajoutez au moins 2 offres pour comparer");
      return;
    }
    
    if (credits < 2) {
      setError("Vous avez besoin de 2 crédits pour cette fonctionnalité");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/calculate/multi-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prix_bien: prixBien,
          apport: apport,
          offers: offers
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResults(data.comparisons);
        setMontantEmprunte(data.montant_emprunte);
        useCredits(2);
      } else {
        setError(data.detail || "Erreur lors de la comparaison");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    if (!results || credits < 1) {
      setError("Vous avez besoin de 1 crédit pour exporter en PDF");
      return;
    }
    
    try {
      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "multi_offer",
          prix_bien: prixBien,
          apport: apport,
          montant_emprunte: montantEmprunte,
          comparisons: results
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comparaison_offres_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        useCredits(1);
      }
    } catch (err) {
      setError("Erreur lors de l'export PDF");
    }
  };

  const exportCSV = async () => {
    if (!results) return;
    
    try {
      const response = await fetch("/api/export/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "multi_offer",
          comparisons: results
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comparaison_offres_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      setError("Erreur lors de l'export CSV");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Comparaison Multi-Offres 
        <span className="text-sm font-normal text-gray-500 ml-2">(2 crédits)</span>
      </h2>
      
      {/* Paramètres généraux */}
      <div className="grid md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prix du bien (€)
          </label>
          <input
            type="number"
            value={prixBien}
            readOnly
            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apport (€)
          </label>
          <input
            type="number"
            value={apport}
            readOnly
            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Liste des offres */}
      <div className="space-y-4 mb-6">
        <h3 className="font-semibold text-gray-900">Offres bancaires</h3>
        
        {offers.map((offer) => (
          <div key={offer.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900">{offer.bank_name}</h4>
              <button
                onClick={() => removeOffer(offer.id)}
                className="text-red-500 hover:text-red-700"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Taux:</span> {offer.taux}%
              </div>
              <div>
                <span className="text-gray-500">Durée:</span> {offer.duree} mois
              </div>
              <div>
                <span className="text-gray-500">Frais:</span> {offer.frais_dossier}€
              </div>
              <div>
                <span className="text-gray-500">Assurance:</span> {offer.taux_assurance}%
              </div>
            </div>
          </div>
        ))}
        
        {/* Formulaire nouvelle offre */}
        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Ajouter une offre</h4>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la banque
              </label>
              <input
                type="text"
                value={newOffer.bank_name}
                onChange={(e) => setNewOffer({...newOffer, bank_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Ex: BNP Paribas"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taux nominal (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={newOffer.taux}
                onChange={(e) => setNewOffer({...newOffer, taux: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée (mois)
              </label>
              <input
                type="number"
                value={newOffer.duree}
                onChange={(e) => setNewOffer({...newOffer, duree: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frais de dossier (€)
              </label>
              <input
                type="number"
                value={newOffer.frais_dossier}
                onChange={(e) => setNewOffer({...newOffer, frais_dossier: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taux assurance (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={newOffer.taux_assurance}
                onChange={(e) => setNewOffer({...newOffer, taux_assurance: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <button
            onClick={addOffer}
            className="mt-3 inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Ajouter l'offre
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <button
        onClick={compareOffers}
        disabled={loading || offers.length < 2 || credits < 2}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {loading ? "Comparaison en cours..." : "Comparer les offres"}
      </button>

      {/* Résultats */}
      {results && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Résultats de la comparaison</h3>
            <div className="flex gap-2">
              <button
                onClick={exportCSV}
                className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                CSV
              </button>
              <button
                onClick={exportPDF}
                disabled={credits < 1}
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                PDF (1 crédit)
              </button>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-blue-900">
              Montant emprunté: <span className="font-bold">{montantEmprunte.toLocaleString()} €</span>
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banque
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taux
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mensualité
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coût total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Économie
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, index) => (
                  <tr key={index} className={index === 0 ? "bg-green-50" : ""}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {result.bank_name}
                        {index === 0 && (
                          <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Meilleure offre
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.taux}%
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {result.mensualite_totale.toLocaleString()} €
                      </div>
                      <div className="text-xs text-gray-500">
                        dont {result.assurance_mensuelle.toLocaleString()} € d'assurance
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.cout_total.toLocaleString()} €
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${result.economie ? 'text-green-600' : 'text-gray-500'}`}>
                        {result.economie ? `+ ${result.economie.toLocaleString()} €` : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}