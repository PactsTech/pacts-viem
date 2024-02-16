import { Buffer } from 'buffer';
import { parseUnits } from 'viem';
import { encrypt } from '@metamask/eth-sig-util';

const version = 'x25519-xsalsa20-poly1305';

export const hexToBase64 = (hex) => Buffer.from(hex.slice(2), 'hex').toString('base64');

export const convertNumber = (number, decimals) => parseUnits(`${number}`, decimals);

export const encryptData = ({ data, publicKeyHex }) => {
  const base64 = hexToBase64(publicKeyHex);
  const encrypted = encrypt({ data, publicKey: base64, version });
  const string = JSON.stringify(encrypted);
  return Buffer.from(string, 'utf8');
};