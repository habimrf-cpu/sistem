
import { Tire, Transaction, Vehicle, AppSettings } from '../types';
import { supabase } from './supabaseClient';

const STORAGE_KEYS = {
  SETTINGS: 'wms-settings'
};

export const dataService = {
  // --- SYSTEM CHECK ---
  checkDatabaseConnection: async (): Promise<{connected: boolean, error?: string}> => {
    const { error } = await supabase.from('tires').select('id').limit(1);
    
    if (error && (
        error.code === '42P01' || 
        error.code === 'PGRST205' || 
        error.message?.includes('relation "public.tires" does not exist') ||
        error.message?.includes('find the table') ||
        error.message?.includes('schema cache')
    )) {
      return { connected: false, error: 'missing_tables' };
    }
    
    if (error && error.message && !error.message.includes("JSON object requested")) {
       console.error("DB Check Error:", JSON.stringify(error, null, 2));
    }

    return { connected: true };
  },

  // --- MANUAL FETCH (FOR INSTANT SYNC) ---
  fetchTires: async (): Promise<Tire[]> => {
    const { data } = await supabase.from('tires').select('*');
    return (data as Tire[]) || [];
  },

  fetchTransactions: async (): Promise<Transaction[]> => {
    const { data } = await supabase.from('transactions').select('*').order('timestamp', { ascending: false });
    return (data as Transaction[]) || [];
  },

  fetchVehicles: async (): Promise<Vehicle[]> => {
    const { data } = await supabase.from('vehicles').select('*');
    return (data as Vehicle[]) || [];
  },

  // --- REAL-TIME LISTENERS (SUPABASE) ---
  subscribeTires: (callback: (tires: Tire[]) => void) => {
    // Initial fetch
    dataService.fetchTires().then(callback);

    // Subscribe
    const channel = supabase.channel('public:tires')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tires' }, () => {
         dataService.fetchTires().then(callback);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },

  subscribeTransactions: (callback: (txs: Transaction[]) => void) => {
    dataService.fetchTransactions().then(callback);

    const channel = supabase.channel('public:transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
         dataService.fetchTransactions().then(callback);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },

  subscribeVehicles: (callback: (vehicles: Vehicle[]) => void) => {
    dataService.fetchVehicles().then(callback);

    const channel = supabase.channel('public:vehicles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
         dataService.fetchVehicles().then(callback);
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
    if (ids.length === 0) return;
    const { error } = await supabase.from('tires').delete().in('id', ids);
    if (error) throw error;
  },

  deleteTransaction: async (id: number) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },

  addTransaction: async (transaction: Transaction) => {
    const { error } = await supabase.from('transactions').insert(transaction);
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

  isSerialUnique: async (serial: string, excludeId?: number): Promise<boolean> => {
     let query = supabase.from('tires').select('id', { count: 'exact', head: true }).eq('serialNumber', serial);
     if (excludeId) query = query.neq('id', excludeId);
     const { count, error } = await query;
     if (error && (error.code === '42P01' || error.code === 'PGRST205')) return true; 
     return count === 0;
  },

  // --- BACKUP / SETTINGS ---
  getSettings: (): AppSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : {
      theme: 'dark',
      stockAlertThreshold: 10,
      reminderStockOpname: true,
    };
  },

  createBackup: async (): Promise<string> => {
    const [tires, transactions, vehicles] = await Promise.all([
        dataService.fetchTires(),
        dataService.fetchTransactions(),
        dataService.fetchVehicles()
    ]);
    return JSON.stringify({ tires, transactions, vehicles, timestamp: new Date().toISOString() }, null, 2);
  },

  restoreBackup: async (jsonData: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonData);
      if (data.tires?.length) await supabase.from('tires').upsert(data.tires);
      if (data.transactions?.length) await supabase.from('transactions').upsert(data.transactions);
      if (data.vehicles?.length) await supabase.from('vehicles').upsert(data.vehicles);
      return true;
    } catch (e) {
      console.error("Restore failed", e);
      return false;
    }
  }
};
