import { useState } from "react";
import { ArrowDownOnSquareIcon, FolderOpenIcon, TrashIcon } from "@heroicons/react/24/outline";
import { scenarioStorage, SavedScenario } from "../utils/scenarioStorage";

interface ScenarioManagerProps {
  currentType: 'basic' | 'variable_rate' | 'optimization' | 'investment' | 'stress_test' | 'multi_offer';
  currentData: any;
  currentResults: any;
  onLoadScenario?: (scenario: SavedScenario) => void;
}

export default function ScenarioManager({ 
  currentType, 
  currentData, 
  currentResults,
  onLoadScenario 
}: ScenarioManagerProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);

  const handleSave = () => {
    if (!scenarioName.trim()) return;
    
    const saved = scenarioStorage.save({
      name: scenarioName,
      type: currentType,
      data: currentData,
      results: currentResults
    });
    
    setScenarioName("");
    setShowSaveDialog(false);
    alert(`Scénario "${saved.name}" sauvegardé avec succès!`);
  };

  const handleLoad = () => {
    const allScenarios = scenarioStorage.getAll();
    setScenarios(allScenarios);
    setShowLoadDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce scénario?")) {
      scenarioStorage.delete(id);
      setScenarios(scenarioStorage.getAll());
    }
  };

  const loadScenario = (scenario: SavedScenario) => {
    if (onLoadScenario) {
      onLoadScenario(scenario);
    }
    setShowLoadDialog(false);
  };

  return (
    <div className="flex gap-2">
      {/* Save Button */}
      <button
        onClick={() => setShowSaveDialog(true)}
        disabled={!currentResults}
        className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
      >
        <ArrowDownOnSquareIcon className="h-4 w-4 mr-1" />
        Sauvegarder
      </button>

      {/* Load Button */}
      <button
        onClick={handleLoad}
        className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
      >
        <FolderOpenIcon className="h-4 w-4 mr-1" />
        Charger
      </button>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Sauvegarder le scénario</h3>
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="Nom du scénario"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={!scenarioName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Charger un scénario</h3>
            
            {scenarios.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucun scénario sauvegardé</p>
            ) : (
              <div className="space-y-2">
                {scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{scenario.name}</h4>
                      <p className="text-sm text-gray-500">
                        Type: {scenario.type} | 
                        Créé le: {new Date(scenario.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadScenario(scenario)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                      >
                        Charger
                      </button>
                      <button
                        onClick={() => handleDelete(scenario.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}