
import CryptoJS from 'crypto-js';
import { Transaction, AdminBankDetails, CompanySettings } from '../types';

const ENCRYPTION_KEY = "SUPER_SECURE_FINANCIAL_KEY_XYZ_123"; 
const DB_KEY = 'secure_financial_db';
const ADMIN_BANK_KEY = 'admin_bank_config';
const COMPANY_SETTINGS_KEY = 'company_settings_config';

const encryptData = (data: any): string => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
};

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

export const saveAdminBankDetails = (details: AdminBankDetails): void => {
    const encryptedDetails = encryptData(details);
    localStorage.setItem(ADMIN_BANK_KEY, encryptedDetails);
};

export const getAdminBankDetails = (): AdminBankDetails | null => {
    const encryptedDetails = localStorage.getItem(ADMIN_BANK_KEY);
    if (!encryptedDetails) return null;
    return decryptData(encryptedDetails);
};

export const saveCompanySettings = (settings: CompanySettings): void => {
    const encrypted = encryptData(settings);
    localStorage.setItem(COMPANY_SETTINGS_KEY, encrypted);
};

export const getCompanySettings = (): CompanySettings => {
    const encrypted = localStorage.getItem(COMPANY_SETTINGS_KEY);
    if (!encrypted) {
        return {
            personalMobileNumber: '9849734395',
            businessWhatsAppNumber: '', // To be added later
            isWhatsAppIntegrated: false,
            whatsAppWelcomeMessage: 'Welcome to ScaleupResume - AI Powered ATS Dominance to secure your future',
            whatsAppEncouragementCycle: true,
            lastUpdatedBy: ''
        };
    }
    return decryptData(encrypted);
};
