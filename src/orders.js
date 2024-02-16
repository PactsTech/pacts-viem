import { v4 as uuidv4 } from 'uuid';
import { getAddress, base64ToHex, toHex } from 'viem';
// eslint-disable-next-line max-len
import { abi } from '@pactstech/contracts/artifacts/contracts/OrderProcessorErc20.sol/OrderProcessorErc20.json';
import { getDecimalsErc20, approveAllowanceErc20 } from './erc20.js';
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

export const setupOrder = async ({
  publicClient,
  walletClient,
  address,
  price,
  shipping,
  metadata
}) => {
  const addresses = await walletClient.requestAddresses();
  const account = addresses[0];
  const buyerPublicKey = await getEncryptionKey({ walletClient, account });
  const token = await getToken({ publicClient, address: pactsAddress });
  const args = await createSubmitArgs({
    publicClient,
    token,
    address,
    buyerPublicKey,
    price,
    shipping,
    metadata
  });
  const amount = args.price + args.shipping;
  const approvalHash = await approveAllowanceErc20({
    address: token,
    publicClient,
    walletClient,
    account,
    amount,
    spender: address
  });
  if (approvalHash) {
    const approvalReceipt = await publicClient.waitForTransactionReceipt({
      hash: approvalHash
    });
    if (approvalReceipt.status !== 'success') {
      const error = new Error('unable to approve erc20 allowance');
      error.receipt = approvalReceipt;
      throw error;
    }
  }
  return args;
};

export const createSubmitArgs = async ({
  publicClient,
  token,
  orderId,
  encryptionKey,
  price,
  shipping,
  metadata
}) => {
  const decimals = await getDecimalsErc20({ publicClient, address: token });
  const id = orderId || uuidv4();
  const buyerPublicKey = base64ToHex(encryptionKey);
  const priceDecimals = convertNumber(price, decimals);
  const shippingDecimals = convertNumber(shipping, decimals);
  const json = JSON.stringify(metadata);
  const metadataHex = toHex(json);
  return {
    orderId: id,
    buyerPublicKey,
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

const getEncryptionKey = async ({ walletClient, account }) => {
  return walletClient.request({ method: 'eth_getEncryptionPublicKey', params: [account] });
};