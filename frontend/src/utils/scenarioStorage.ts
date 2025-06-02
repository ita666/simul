export interface SavedScenario {
  id: string;
  name: string;
  type: 'basic' | 'variable_rate' | 'optimization' | 'investment' | 'stress_test' | 'multi_offer';
  data: any;
  results: any;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'simulpret_scenarios';

export const scenarioStorage = {
  // Get all scenarios
  getAll(): SavedScenario[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading scenarios:', error);
      return [];
    }
  },

  // Get a single scenario by ID
  getById(id: string): SavedScenario | null {
    const scenarios = this.getAll();
    return scenarios.find(s => s.id === id) || null;
  },

  // Save a new scenario
  save(scenario: Omit<SavedScenario, 'id' | 'created_at' | 'updated_at'>): SavedScenario {
    const scenarios = this.getAll();
    const newScenario: SavedScenario = {
      ...scenario,
      id: `scenario_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    scenarios.push(newScenario);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
    
    return newScenario;
  },

  // Update an existing scenario
  update(id: string, updates: Partial<SavedScenario>): SavedScenario | null {
    const scenarios = this.getAll();
    const index = scenarios.findIndex(s => s.id === id);
    
    if (index === -1) return null;
    
    scenarios[index] = {
      ...scenarios[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
    return scenarios[index];
  },

  // Delete a scenario
  delete(id: string): boolean {
    const scenarios = this.getAll();
    const filtered = scenarios.filter(s => s.id !== id);
    
    if (filtered.length === scenarios.length) return false;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  // Clear all scenarios
  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
};