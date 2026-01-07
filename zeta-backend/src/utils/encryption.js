import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.PHONE_ENCRYPTION_KEY;

// Encrypt phone number
export const encryptPhone = (phoneNo) => {
  try {
    return CryptoJS.AES.encrypt(phoneNo, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt phone number');
  }
};

// Decrypt phone number
export const decryptPhone = (encryptedPhone) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPhone, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt phone number');
  }
};