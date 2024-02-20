import { Buffer } from 'buffer';
import { parseUnits } from 'viem';
import { encrypt } from '@metamask/eth-sig-util';

const version = 'x25519-xsalsa20-poly1305';

export const utf8ToHex = (utf8) => `0x${Buffer.from(utf8, 'utf8').toString('hex')}`;
export const base64ToHex = (base64) => `0x${Buffer.from(base64, 'base64').toString('hex')}`;
export const hexToBase64 = (hex) => Buffer.from(hex.slice(2), 'hex').toString('base64');

export const convertNumber = (number, decimals) => {
  const normalized = typeof decimals === 'bigint' ? Number(decimals) : decimals;
  return parseUnits(`${number}`, normalized);
};

export const encryptData = ({ data, publicKeyHex }) => {
  const base64 = hexToBase64(publicKeyHex);
  const encrypted = encrypt({ data, publicKey: base64, version });
  const string = JSON.stringify(encrypted);
  return utf8ToHex(string);
};