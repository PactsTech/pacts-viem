import { getAddress, getContract } from 'viem';
import { encrypt } from '@metamask/eth-sig-util';
// eslint-disable-next-line max-len
import { abi, bytecode } from '@pactstech/contracts/artifacts/contracts/OrderProcessorErc20.sol/OrderProcessorErc20.json';

const version = 'x25519-xsalsa20-poly1305';

export const getProcessor = (params) => getContract({ abi, ...params });

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
};

export const submitOrder = async ({
  walletClient,
  orderId,
  price,
  shipping,
  metadata,
  ...params
}) => {
  return walletClient.writeContract({
    ...params,
    abi,
    functionName: 'submit',
    args: [orderId, price, shipping, metadata]
  });
};

export const shipOrder = async ({
  publicClient,
  walletClient,
  address,
  orderId,
  carrier,
  trackingNumber,
  ...params
}) => {
  const checksum = getAddress(address);
  const processor = getProcessor({ address: checksum, publicClient, walletClient, ...params });
  const [order, reporterPublicKey, arbiterPublicKey] = await Promise.all([
    processor.read.getOrder([orderId]),
    processor.read.reporterPublicKey([]),
    processor.read.arbiterPublicKey([])
  ]);
  const buyerPublicKey = order[3];
  const data = JSON.stringify({ carrier, trackingNumber });
  const shipmentBuyer = encryptData({ data, publicKeyHex: buyerPublicKey });
  const shipmentReporter = encryptData({ data, publicKeyHex: reporterPublicKey });
  const shipmentArbiter = encryptData({ data, publicKeyHex: arbiterPublicKey });
  return contract.write.ship([orderId, shipmentBuyer, shipmentReporter, shipmentArbiter]);
};

export const deliverOrder = async ({ walletClient, orderId, ...params }) => {
  return walletClient.writeContract({
    ...params,
    abi,
    function: 'deliver',
    args: [orderId]
  });
};

export const failOrder = async ({ walletClient, orderId, ...params }) => {
  return walletClient.writeContract({
    ...params,
    abi,
    function: 'fail',
    args: [orderId]
  });
};

export const getOrder = async ({ publicClient, orderId, ...params }) => {
  const [
    sequence,
    state,
    buyer,
    buyerPublicKey,
    price,
    shipping,
    lastModifiedBlock,
    metadata,
    shipmentBuyer,
    shipmentReporter,
    shipmentArbiter
  ] = await publicClient.readContract({
    ...params,
    abi,
    functionName: 'getOrder',
    args: [orderId]
  });
  return {
    id: orderId,
    sequence,
    state,
    buyer,
    buyerPublicKey,
    price,
    shipping,
    lastModifiedBlock,
    metadata,
    shipmentBuyer,
    shipmentReporter,
    shipmentArbiter
  };
};

export const getReporterPublicKey = async ({ publicClient, ...params }) => {
  return publicClient.readContract({
    ...params,
    abi,
    functionName: 'reporterPublicKey',
    args: []
  });
};

export const getArbiterPublicKey = async ({ publicClient, ...params }) => {
  return publicClient.readContract({
    ...params,
    abi,
    functionName: 'arbiterPublicKey',
    args: []
  });
};

const hexToBase64 = (hex) => Buffer.from(hex.slice(2), 'hex').toString('base64');

const encryptData = ({ data, publicKeyHex }) => {
  const base64 = hexToBase64(publicKeyHex);
  const encrypted = encrypt({ data, publicKey: base64, version });
  const string = JSON.stringify(encrypted);
  return Buffer.from(string, 'utf8');
};