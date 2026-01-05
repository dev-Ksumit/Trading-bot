import CryptoJS from "crypto-js";

export const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, process.env.ENCRYPTION_SECRET).toString();
};

export const decrypt = (cipherText) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, process.env.ENCRYPTION_SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
};
