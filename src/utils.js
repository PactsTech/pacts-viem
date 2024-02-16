import { Buffer } from 'buffer';
import { parseUnits, hexToBase64 } from 'viem';
import { encrypt } from '@metamask/eth-sig-util';

const version = 'x25519-xsalsa20-poly1305';

export const convertNumber = (number, decimals) => {
  const normalized = typeof decimals === 'bigint' ? Number(decimals) : decimals;
  return parseUnits(`${number}`, normalized);
};

export const encryptData = ({ data, publicKeyHex }) => {
  const base64 = hexToBase64(publicKeyHex);
  const encrypted = encrypt({ data, publicKey: base64, version });
  const string = JSON.stringify(encrypted);
  return Buffer.from(string, 'utf8');
};