import { getAddress } from 'viem';
// eslint-disable-next-line max-len
import { abi } from '@pactstech/contracts/artifacts/contracts/OrderProcessorErc20.sol/OrderProcessorErc20.json';
import { getDecimals } from './erc20.js';
import { convertNumber, encryptData } from './utils.js';

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

export const createSubmitArgs = async ({
  publicClient,
  token,
  orderId,
  buyerPublicKey,
  price,
  shipping,
  metadata
}) => {
  const decimals = await getDecimals({ publicClient, address: token });
  const id = orderId || uuidv4();
  const publicKey = `0x${Buffer.from(buyerPublicKey, 'base64').toString('hex')}`;
  const priceDecimals = convertNumber(price, decimals);
  const shippingDecimals = convertNumber(shipping, decimals);
  const json = JSON.stringify(metadata);
  const metadataHex = `0x${Buffer.from(json, 'utf8').toString('hex')}`;
  return {
    orderId: id,
    buyerPublicKey: publicKey,
    price: priceDecimals,
    shipping: shippingDecimals,
    metadata: metadataHex
  };
};

export const submitOrder = async ({
  walletClient,
  orderId,
  buyerPublicKey,
  price,
  shipping,
  metadata,
  ...params
}) => {
  return walletClient.writeContract({
    ...params,
    abi,
    functionName: 'submit',
    args: [orderId, buyerPublicKey, price, shipping, metadata]
  });
};

export const shipOrder = async ({
  publicClient,
  walletClient,
  address,
  orderId,
  shipment,
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
  const data = JSON.stringify(shipment);
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
