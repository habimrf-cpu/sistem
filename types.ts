
export interface Tire {
  id: number;
  serialNumber: string;
  brand: string;
  size: string;
  status: 'available' | 'out';
  condition: 'Baru' | 'Bekas Baik' | 'Bekas Cukup' | 'Perlu Repair';
  location: string;
  supplier?: string;
  dateIn: string; // YYYY-MM-DD
  dateOut?: string | null; // YYYY-MM-DD
  plateNumber?: string | null;
  odometer?: number | null;
  notes?: string;
  createdBy: string;
  updatedAt: number;
}

export interface Transaction {
  id: number;
  type: 'in' | 'out';
  serialNumber: string;
  brand: string;
  size: string;
  condition: string;
  date: string; // YYYY-MM-DD
  plateNumber?: string | null;
  odometer?: number | null;
  notes?: string;
  user: string;
  timestamp: number;
}

export interface Vehicle {
  id: number;
  plateNumber: string;
  vehicleType: string;
  department: string; // Used for RKI, TEAM, etc.
  driver: string;
  status: 'active' | 'inactive';
  tireHistory: {
    serialNumber: string;
    dateInstalled: string;
    odometer: number;
  }[];
}

export interface AppSettings {
  theme: 'dark' | 'light';
  stockAlertThreshold: number;
  reminderStockOpname: boolean;
  lastStockOpname?: string;
}

export interface UserProfile {
  email: string;
  name: string;
  picture: string;
  role: 'admin' | 'user' | 'guest';
}

export type ViewState = 'dashboard' | 'stock' | 'transactions' | 'vehicles' | 'settings';

export const BRAND_OPTIONS = []; // Deprecated as per request
export const SIZE_OPTIONS = [
  'BAN TMD 97 11.00',
  'BAN TMD 18 10.00',
  'BAN MRF M77 11.00',
  'BAN MASAK'
];
export const CONDITION_OPTIONS = ['Baru', 'Bekas Baik', 'Bekas Cukup', 'Perlu Repair'];
export const VEHICLE_GROUPS = ['RKI', 'TEAM', 'TKN', 'GAB', 'RSI', 'TONI'];
export const VEHICLE_TYPES = ['FAW', 'FUSO'];