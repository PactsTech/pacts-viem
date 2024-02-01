import { abi, bytecode } from 'pacts-contracts/artifacts/contracts/OrderProcessorErc20.sol/OrderProcessorErc20.json'
import { encrypt } from '@metamask/eth-sig-util';

const version = 'x25519-xsalsa20-poly1305';

export const deployProcessor = async ({
  walletClient,
  storeName,
  reporter,
  reporterPublicKey,
  arbiter,
  arbiterPublicKey,
  token,
  ...params
}) => {
  return walletClient.deployContract({
    ...params,
    abi,
    bytecode,
    args: [storeName, reporter, reporterPublicKey, arbiter, arbiterPublicKey, token]
  });
}

export const submitOrder = async ({ walletClient, orderId, price, shipping, metadata, ...params }) => {
  return walletClient.writeContract({
    ...params,
    abi,
    functionName: 'submit',
    args: [orderId, price, shipping, metadata]
  });
}

export const shipOrder = async ({
  walletClient,
  orderId,
  buyerPublicKey,
  reporterPublicKey,
  carrier,
  trackingNumber,
  ...params
}) => {
  const data = JSON.stringify({ carrier, trackingNumber });
  const shipmentBuyer = encryptData({ data, publicKeyHex: buyerPublicKey });
  const shipmentReporter = encryptData({ data, publicKeyHex: reporterPublicKey });
  return walletClient.writeContract({
    ...params,
    abi,
    function: 'ship',
    args: [orderId, shipmentBuyer, shipmentReporter]
  });
}

export const deliverOrder = async ({ walletClient, orderId, ...params }) => {
  return walletClient.writeContract({
    ...params,
    abi,
    function: 'deliver',
    args: [orderId]
  });
}

export const failOrder = async ({ walletClient, orderId, ...params }) => {
  return walletClient.writeContract({
    ...params,
    abi,
    function: 'fail',
    args: [orderId]
  });
}

export const getReporterPublicKey = async ({ publicClient, ...params }) => {
  return publicClient.readContract({
    ...params,
    abi,
    function: 'getReporterPublicKey',
    args: []
  });
};

export const getArbiterPublicKey = async ({ publicClient, ...params }) => {
  return publicClient.readContract({
    ...params,
    abi,
    function: 'getArbiterPublicKey',
    args: []
  });
};

export const getOrder = async ({ publicClient, orderId, ...params }) => {
  const [
    sequence,
    buyer,
    buyerPublicKey,
    price,
    shipping,
    submittedBlock,
    shippedBlock,
    deliveredBlock,
    state,
    metadata,
    shipmentBuyer,
    shipmentReporter
  ] = await publicClient.readContract({
    ...params,
    abi,
    functionName: 'getOrder',
    args: [orderId]
  });
  return {
    id: orderId,
    sequence,
    buyer,
    buyerPublicKey,
    price,
    shipping,
    submittedBlock,
    shippedBlock,
    deliveredBlock,
    state,
    metadata,
    shipmentBuyer,
    shipmentReporter
  };
}

const hexToBase64 = (hex) => Buffer.from(hex.slice(2), 'hex').toString('base64');

const encryptData = ({ data, publicKeyHex }) => {
  const base64 = hexToBase64(publicKeyHex);
  const encrypted = encrypt({ data, publicKey: base64, version });
  const string = JSON.stringify(encrypted);
  return Buffer.from(string, 'utf8');
};