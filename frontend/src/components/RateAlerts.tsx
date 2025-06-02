import { useState, useEffect } from "react";
import { BellIcon, BellAlertIcon, TrashIcon } from "@heroicons/react/24/outline";

interface RateAlert {
  id: string;
  bankName: string;
  duration: number;
  targetRate: number;
  currentRate: number;
  created_at: string;
  notified: boolean;
}

const ALERTS_STORAGE_KEY = 'simulpret_rate_alerts';

export default function RateAlerts() {
  const [alerts, setAlerts] = useState<RateAlert[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    bankName: "",
    duration: 240,
    targetRate: 3.0
  });

  // Load alerts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (stored) {
      setAlerts(JSON.parse(stored));
    }
  }, []);

  // Save alerts to localStorage
  useEffect(() => {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  }, [alerts]);

  // Check alerts against current rates
  useEffect(() => {
    const checkAlerts = async () => {
      try {
        const response = await fetch('/api/bank-rates');
        const data = await response.json();
        
        if (data.rates) {
          const updatedAlerts = alerts.map(alert => {
            const bankRate = data.rates.find((r: any) => 
              r.bank_name === alert.bankName
            );
            
            if (bankRate) {
              const currentRate = bankRate[`rate_${alert.duration / 12}_years`];
              
              if (currentRate && currentRate <= alert.targetRate && !alert.notified) {
                // Show notification
                showNotification(alert, currentRate);
                
                return {
                  ...alert,
                  currentRate,
                  notified: true
                };
              }
              
              return {
                ...alert,
                currentRate: currentRate || alert.currentRate
              };
            }
            
            return alert;
          });
          
          setAlerts(updatedAlerts);
        }
      } catch (error) {
        console.error('Error checking rate alerts:', error);
      }
    };

    if (alerts.length > 0) {
      checkAlerts();
      const interval = setInterval(checkAlerts, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [alerts.length]);

  const showNotification = (alert: RateAlert, currentRate: number) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Alerte Taux Immobilier!', {
        body: `Le taux de ${alert.bankName} (${alert.duration / 12} ans) est descendu à ${currentRate}% !`,
        icon: '/favicon.ico'
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  };

  const createAlert = () => {
    if (!newAlert.bankName) return;
    
    const alert: RateAlert = {
      id: Date.now().toString(),
      ...newAlert,
      currentRate: 0,
      created_at: new Date().toISOString(),
      notified: false
    };
    
    setAlerts([...alerts, alert]);
    setNewAlert({ bankName: "", duration: 240, targetRate: 3.0 });
    setShowCreateForm(false);
    
    requestNotificationPermission();
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Alertes Taux
        </h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <BellIcon className="h-5 w-5 mr-2" />
          Créer une alerte
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <BellAlertIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucune alerte configurée</p>
          <p className="text-sm text-gray-400 mt-2">
            Créez des alertes pour être notifié quand les taux baissent
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 border rounded-lg ${
                alert.notified ? 'bg-green-50 border-green-200' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {alert.bankName} - {alert.duration / 12} ans
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Alerte si le taux descend sous {alert.targetRate}%
                  </p>
                  {alert.currentRate > 0 && (
                    <p className="text-sm mt-1">
                      Taux actuel: 
                      <span className={`font-medium ml-1 ${
                        alert.currentRate <= alert.targetRate ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {alert.currentRate}%
                      </span>
                    </p>
                  )}
                  {alert.notified && (
                    <p className="text-sm text-green-600 font-medium mt-2">
                      ✓ Objectif atteint!
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Alert Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Créer une alerte</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banque
                </label>
                <select
                  value={newAlert.bankName}
                  onChange={(e) => setNewAlert({...newAlert, bankName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Sélectionner une banque</option>
                  <option value="Crédit Agricole">Crédit Agricole</option>
                  <option value="BNP Paribas">BNP Paribas</option>
                  <option value="Société Générale">Société Générale</option>
                  <option value="Crédit Mutuel">Crédit Mutuel</option>
                  <option value="LCL">LCL</option>
                  <option value="Caisse d'Épargne">Caisse d'Épargne</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durée du prêt
                </label>
                <select
                  value={newAlert.duration}
                  onChange={(e) => setNewAlert({...newAlert, duration: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={120}>10 ans</option>
                  <option value={180}>15 ans</option>
                  <option value={240}>20 ans</option>
                  <option value={300}>25 ans</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taux cible (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newAlert.targetRate}
                  onChange={(e) => setNewAlert({...newAlert, targetRate: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={createAlert}
                disabled={!newAlert.bankName}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
              >
                Créer l'alerte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}