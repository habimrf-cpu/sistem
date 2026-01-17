import { Tire, Transaction, Vehicle, AppSettings } from '../types';
import { supabase } from './supabaseClient';

const STORAGE_KEYS = {
  SETTINGS: 'wms-settings'
};

export const dataService = {
  // --- SYSTEM CHECK ---
  checkDatabaseConnection: async (): Promise<{connected: boolean, error?: string}> => {
    // Coba query sederhana ke tabel utama
    const { error } = await supabase.from('tires').select('id').limit(1);
    
    // Postgres Error 42P01 = undefined_table (Tabel tidak ditemukan)
    // Supabase Error PGRST205 = relation not found in schema cache
    if (error && (
        error.code === '42P01' || 
        error.code === 'PGRST205' || 
        error.message?.includes('relation "public.tires" does not exist') ||
        error.message?.includes('find the table') ||
        error.message?.includes('schema cache')
    )) {
      return { connected: false, error: 'missing_tables' };
    }
    
    // Error koneksi lain
    if (error && error.message) {
       console.error("DB Check Error:", JSON.stringify(error, null, 2));
       // Abaikan error "JWT expired" atau permission saat check awal, anggap connected dulu
       // agar UI tidak panik, biarkan RLS yang handle nanti.
       if (!error.message.includes("JSON object requested")) {
           return { connected: true }; 
       }
    }

    return { connected: true };
  },

  // --- REAL-TIME LISTENERS (SUPABASE) ---
  
  subscribeTires: (callback: (tires: Tire[]) => void) => {
    // 1. Fetch Initial Data
    supabase.from('tires').select('*').then(({ data, error }) => {
       if (!error && data) callback(data as Tire[]);
    });

    // 2. Subscribe to Changes
    const channel = supabase.channel('public:tires')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tires' }, () => {
         // Naive refresh: Fetch all on any change to ensure consistency
         supabase.from('tires').select('*').then(({ data }) => {
            if (data) callback(data as Tire[]);
         });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },

  subscribeTransactions: (callback: (txs: Transaction[]) => void) => {
    supabase.from('transactions').select('*').order('timestamp', { ascending: false }).then(({ data, error }) => {
       if (!error && data) callback(data as Transaction[]);
    });

    const channel = supabase.channel('public:transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
         supabase.from('transactions').select('*').order('timestamp', { ascending: false }).then(({ data }) => {
            if (data) callback(data as Transaction[]);
         });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },

  subscribeVehicles: (callback: (vehicles: Vehicle[]) => void) => {
    supabase.from('vehicles').select('*').then(({ data, error }) => {
       if (!error && data) callback(data as Vehicle[]);
    });

    const channel = supabase.channel('public:vehicles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
         supabase.from('vehicles').select('*').then(({ data }) => {
            if (data) callback(data as Vehicle[]);
         });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },

  // --- ACTIONS (RLS Protected) ---

  saveTire: async (tire: Tire) => {
    const { error } = await supabase.from('tires').upsert(tire);
    if (error) throw error;
  },

  deleteTire: async (id: number) => {
    const { error } = await supabase.from('tires').delete().eq('id', id);
    if (error) throw error;
  },

  deleteTires: async (ids: number[]) => {
    const { error } = await supabase.from('tires').delete().in('id', ids);
    if (error) throw error;
  },

  isSerialUnique: async (serial: string, excludeId?: number): Promise<boolean> => {
     // Check directly against DB
     let query = supabase.from('tires').select('id', { count: 'exact', head: true }).eq('serialNumber', serial);
     
     if (excludeId) {
        query = query.neq('id', excludeId);
     }
     
     const { count, error } = await query;
     if (error) {
        // Jika error tabel belum ada, anggap unique true dulu biar gak blocking UI logic (error akan ditangkap saat save)
        if (error.code === '42P01' || error.code === 'PGRST205') return true; 
        console.error(error);
        return false; 
     }
     return count === 0;
  },

  addTransaction: async (transaction: Transaction) => {
    const { error } = await supabase.from('transactions').insert(transaction);
    if (error) throw error;
  },

  deleteTransaction: async (id: number) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },

  saveVehicle: async (vehicle: Vehicle) => {
    const { error } = await supabase.from('vehicles').upsert(vehicle);
    if (error) throw error;
  },

  deleteVehicle: async (id: number) => {
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) throw error;
  },

  // --- SETTINGS (Local Storage for Theme) ---
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

  // --- BACKUP / RESTORE ---
  createBackup: async (): Promise<string> => {
    // Fetch all fresh data from Supabase
    const { data: tires } = await supabase.from('tires').select('*');
    const { data: transactions } = await supabase.from('transactions').select('*');
    const { data: vehicles } = await supabase.from('vehicles').select('*');

    return JSON.stringify({ tires, transactions, vehicles, timestamp: new Date().toISOString() }, null, 2);
  },

  restoreBackup: async (jsonData: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonData);
      
      // Batch Insert/Upsert
      if (data.tires?.length) {
          const { error } = await supabase.from('tires').upsert(data.tires);
          if (error) throw error;
      }
      if (data.transactions?.length) {
          const { error } = await supabase.from('transactions').upsert(data.transactions);
          if (error) throw error;
      }
      if (data.vehicles?.length) {
          const { error } = await supabase.from('vehicles').upsert(data.vehicles);
          if (error) throw error;
      }

      return true;
    } catch (e) {
      console.error("Restore failed", e);
      return false;
    }
  }
};