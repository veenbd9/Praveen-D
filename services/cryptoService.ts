import CryptoJS from 'crypto-js';
import { Transaction, AdminBankDetails } from '../types';

// In a real production app, this key should NEVER be hardcoded in the frontend.
// It should be an environment variable or handled by a backend key management system.
// For this simulation, we are locking the mock database with this key.
const ENCRYPTION_KEY = "SUPER_SECURE_FINANCIAL_KEY_XYZ_123"; 
const DB_KEY = 'secure_financial_db';
const ADMIN_BANK_KEY = 'admin_bank_config';

// Helper to encrypt data
const encryptData = (data: any): string => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
};

// Helper to decrypt data
const decryptData = (ciphertext: string): any => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
        const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        return decryptedData;
    } catch (e) {
        console.error("Failed to decrypt data", e);
        return null;
    }
};

// --- Transaction Management ---

export const saveTransaction = (transaction: Transaction): void => {
    const currentDb = getAllTransactions();
    currentDb.push(transaction);
    const encryptedDb = encryptData(currentDb);
    localStorage.setItem(DB_KEY, encryptedDb);
};

export const getAllTransactions = (): Transaction[] => {
    const encryptedDb = localStorage.getItem(DB_KEY);
    if (!encryptedDb) return [];
    return decryptData(encryptedDb) || [];
};

export const getUserTransactions = (userId: string): Transaction[] => {
    const all = getAllTransactions();
    return all.filter(t => t.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
};

// --- Admin Bank Config Management ---

export const saveAdminBankDetails = (details: AdminBankDetails): void => {
    const encryptedDetails = encryptData(details);
    localStorage.setItem(ADMIN_BANK_KEY, encryptedDetails);
};

export const getAdminBankDetails = (): AdminBankDetails | null => {
    const encryptedDetails = localStorage.getItem(ADMIN_BANK_KEY);
    if (!encryptedDetails) return null;
    return decryptData(encryptedDetails);
};
