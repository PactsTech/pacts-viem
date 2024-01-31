import { abi, bytecode } from 'pacts-contracts/artifacts/contracts/OrderProcessorErc20.sol/OrderProcessorErc20.json'
import { encrypt } from '@metamask/eth-sig-util';

const version = 'x25519-xsalsa20-poly1305';

export async function deployContract({
  walletClient,
  name,
  reporter,
  reporterPublicKey,
  arbiter,
  arbiterPublicKey,
  token,
  ...params
}) {
  return walletClient.deployContract({
    ...params,
    abi,
    bytecode,
    args: [name, reporter, reporterPublicKey, arbiter, arbiterPublicKey, token]
  });
}

export async function submitOrder({ walletClient, orderId, price, shipping, metadata, ...params }) {
  return walletClient.writeContract({
    ...params,
    abi,
    functionName: 'submit',
    args: [orderId, price, shipping, metadata]
  });
}

export async function shipOrder({
  walletClient,
  orderId,
  buyerPublicKeyHex,
  reporterPublicKeyHex,
  carrier,
  trackingNumber,
  ...params
}) {
  const buyerPublicKeyBase64 = hexToBase64(buyerPublicKeyHex);
  const reporterPublicKeyBase64 = hexToBase64(reporterPublicKeyHex);
  const data = JSON.stringify({ carrier, trackingNumber });
  const shipmentBuyerObject = encrypt({ data, publicKey: buyerPublicKeyBase64, version });
  const shipmentReporterObject = encrypt({ data, publicKey: reporterPublicKeyBase64, version });
  const shipmentBuyer = JSON.stringify(shipmentBuyerObject);
  const shipmentReporter = JSON.stringify(shipmentReporterObject);
  const shipmentBuyerBytes = Buffer.from(shipmentBuyer);
  const shipmentReporterBytes = Buffer.from(shipmentReporter, 'utf8');
  return walletClient.writeContract({
    ...params,
    abi,
    function: 'ship',
    args: [orderId, shipmentBuyerBytes, shipmentReporterBytes]
  });
}

export async function getOrder({ publicClient, orderId, ...params }) {
  const response = await publicClient.readContract({
    ...params,
    abi,
    functionName: 'getOrder',
    args: [orderId]
  });
  console.log({ response });
}

const hexToBase64 = (hex) => Buffer.from(hex.slice(2), 'hex').toString('base64');