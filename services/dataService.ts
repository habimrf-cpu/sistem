import { Tire, Transaction, Vehicle, AppSettings } from '../types';

const STORAGE_KEYS = {
  TIRES: 'wms-tires',
  TRANSACTIONS: 'wms-transactions',
  VEHICLES: 'wms-vehicles',
  SETTINGS: 'wms-settings'
};

// Initial Mock Data to populate the app if empty
const INITIAL_TIRES: Tire[] = [
  {
    id: 1715481200000,
    serialNumber: 'SN-2024-001',
    brand: 'Bridgestone',
    size: '11.00-20',
    status: 'available',
    condition: 'Baru',
    location: 'Rak A1',
    dateIn: '2024-05-01',
    createdBy: 'Admin',
    updatedAt: 1715481200000
  },
  {
    id: 1715481300000,
    serialNumber: 'SN-2024-002',
    brand: 'Gajah Tunggal',
    size: 'TMD 18 - 10.00',
    status: 'out',
    condition: 'Bekas Baik',
    location: '-',
    dateIn: '2024-04-15',
    dateOut: '2024-05-10',
    plateNumber: 'B 9999 XYZ',
    odometer: 50000,
    createdBy: 'Admin',
    updatedAt: 1715481300000
  }
];

const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 1,
    plateNumber: 'B 9999 XYZ',
    vehicleType: 'Hino 500',
    department: 'Logistik',
    driver: 'Budi Santoso',
    status: 'active',
    tireHistory: [
      { serialNumber: 'SN-2024-002', dateInstalled: '2024-05-10', odometer: 50000 }
    ]
  }
];

export const dataService = {
  // --- Tires ---
  getTires: (): Tire[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TIRES);
    return data ? JSON.parse(data) : INITIAL_TIRES;
  },

  saveTire: (tire: Tire): void => {
    const tires = dataService.getTires();
    const existingIndex = tires.findIndex(t => t.id === tire.id);
    
    if (existingIndex >= 0) {
      tires[existingIndex] = tire;
    } else {
      tires.push(tire);
    }
    localStorage.setItem(STORAGE_KEYS.TIRES, JSON.stringify(tires));
  },

  deleteTire: (id: number): void => {
    const tires = dataService.getTires().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TIRES, JSON.stringify(tires));
  },

  deleteTires: (ids: number[]): void => {
    const tires = dataService.getTires().filter(t => !ids.includes(t.id));
    localStorage.setItem(STORAGE_KEYS.TIRES, JSON.stringify(tires));
  },

  isSerialUnique: (serial: string, excludeId?: number): boolean => {
    const tires = dataService.getTires();
    return !tires.some(t => t.serialNumber === serial && t.id !== excludeId);
  },

  // --- Transactions ---
  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },

  addTransaction: (transaction: Transaction): void => {
    const transactions = dataService.getTransactions();
    transactions.unshift(transaction); // Add to beginning
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  // --- Vehicles ---
  getVehicles: (): Vehicle[] => {
    const data = localStorage.getItem(STORAGE_KEYS.VEHICLES);
    return data ? JSON.parse(data) : INITIAL_VEHICLES;
  },

  saveVehicle: (vehicle: Vehicle): void => {
    const vehicles = dataService.getVehicles();
    const existingIndex = vehicles.findIndex(v => v.id === vehicle.id);
    if (existingIndex >= 0) {
      vehicles[existingIndex] = vehicle;
    } else {
      vehicles.push(vehicle);
    }
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
  },

  deleteVehicle: (id: number): void => {
     const vehicles = dataService.getVehicles().filter(v => v.id !== id);
     localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
  },

  // --- Settings ---
  getSettings: (): AppSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : {
      theme: 'dark',
      stockAlertThreshold: 10,
      reminderStockOpname: true,
    };
  },

  saveSettings: (settings: AppSettings): void => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // --- Backup/Restore ---
  createBackup: (): string => {
    const backup = {
      tires: dataService.getTires(),
      transactions: dataService.getTransactions(),
      vehicles: dataService.getVehicles(),
      settings: dataService.getSettings(),
      timestamp: new Date().toISOString()
    };
    return JSON.stringify(backup, null, 2);
  },

  restoreBackup: (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.tires) localStorage.setItem(STORAGE_KEYS.TIRES, JSON.stringify(data.tires));
      if (data.transactions) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
      if (data.vehicles) localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(data.vehicles));
      if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      return true;
    } catch (e) {
      console.error("Restore failed", e);
      return false;
    }
  }
};