import { v4 as uuidv4 } from 'uuid';
import { Address, Chain, Client, Hex, getAddress } from 'viem';
import { getDecimalsErc20, approveAllowanceErc20 } from './erc20';
import { Processor } from './processor';
import { convertNumber, utf8ToHex, base64ToHex, encryptData } from './utils';
import { PublicClient } from 'viem';
import { WalletClient } from 'viem';
import { WriteContractParameters } from 'viem';

export type State =
  | 'submitted'
  | 'shipped'
  | 'delivered'
  | 'failed'
  | 'canceled'
  | 'aborted'
  | 'disputed'
  | 'resolved';

export type Order = {
  id: string;
  sequence: bigint;
  buyer: Address;
  buyerPublicKey: string;
  price: bigint;
  shipping: bigint;
  lastModifiedBlock: bigint;
  state: State;
  metadata: Hex;
  shipmentBuyer: Hex;
  shipmentReporter: Hex;
};

export type Shipment = [string, string];

type SlimWriteContractParameters = Omit<WriteContractParameters, 'abi' | 'functionName' | 'args'>;

type GetOrderParameters = {
  processor: Processor;
  orderId: string;
};

export const getOrder = async ({ processor, orderId }: GetOrderParameters) => {
  const [
    sequence,
    state,
    buyer,
    buyerPublicKey,
    reporter,
    reporterPublicKey,
    arbiter,
    arbiterPublicKey,
    price,
    shipping,
    lastModifiedBlock,
    metadata,
    shipmentBuyer,
    shipmentReporter,
    shipmentArbiter
  ] = (await processor.read.getOrder([orderId])) as Array<unknown>;
  return {
    id: orderId,
    sequence,
    state,
    buyer,
    buyerPublicKey,
    reporter,
    reporterPublicKey,
    arbiter,
    arbiterPublicKey,
    price,
    shipping,
    lastModifiedBlock,
    metadata,
    shipmentBuyer,
    shipmentReporter,
    shipmentArbiter
  };
};

type SetupOrderParamters = {
  chain?: Chain,
  publicClient: PublicClient;
  walletClient: WalletClient;
  processor: Processor;
  orderId?: string;
  price: bigint;
  shipping: bigint;
  metadata: any;
};

export const setupOrder = async ({
  chain,
  publicClient,
  walletClient,
  processor,
  orderId,
  price,
  shipping,
  metadata
}: SetupOrderParamters) => {
  const addresses = await walletClient.requestAddresses();
  const account = addresses[0];
  const buyerPublicKey = (await getEncryptionKey({ walletClient, account })) as string;
  const token = (await processor.read.token([])) as Address;
  const args = await createSubmitArgs({
    publicClient,
    processor,
    account,
    token,
    orderId,
    buyerPublicKey,
    price,
    shipping,
    metadata
  });
  const amount = args.price + args.shipping;
  const approvalHash = await approveAllowanceErc20({
    chain,
    address: token,
    publicClient,
    walletClient,
    account,
    amount,
    spender: processor.address
  });
  if (approvalHash) {
    const approvalReceipt = await publicClient.waitForTransactionReceipt({
      hash: approvalHash
    });
    if (approvalReceipt.status !== 'success') {
      throw new Error('unable to approve erc20 allowance');
    }
  }
  return args;
};

type CreateSubmitArgsParameters = {
  publicClient: PublicClient;
  processor: Processor;
  account: Address;
  token: Address;
  orderId?: string;
  buyerPublicKey: string;
  price: bigint;
  shipping: bigint;
  metadata?: any;
};

export const createSubmitArgs = async ({
  publicClient,
  processor,
  account,
  token,
  orderId,
  buyerPublicKey,
  price,
  shipping,
  metadata
}: CreateSubmitArgsParameters) => {
  const decimals = await getDecimalsErc20({ publicClient, address: token });
  const [reporter, arbiter] = await Promise.all([
    processor.read.getReporter([]),
    processor.read.getArbiter([])
  ]);
  const id = orderId || uuidv4();
  const buyerPublicKeyHex = base64ToHex(buyerPublicKey);
  const reporterAddress = getAddress(reporter as string);
  const arbiterAddress = getAddress(arbiter as string);
  const priceDecimals = convertNumber(price, decimals);
  const shippingDecimals = convertNumber(shipping, decimals);
  const json = JSON.stringify(metadata || {});
  const metadataHex = utf8ToHex(json);
  return {
    account,
    address: processor.address,
    orderId: id,
    buyerPublicKey: buyerPublicKeyHex,
    reporter: reporterAddress,
    arbiter: arbiterAddress,
    price: priceDecimals,
    shipping: shippingDecimals,
    metadata: metadataHex
  };
};

type SubmitOrderParamters = {
  processor: Processor;
  orderId: string;
  buyerPublicKey: Hex;
  reporter: Address;
  arbiter: Address;
  price: bigint;
  shipping: bigint;
  metadata: Hex;
};

export const submitOrder = async ({
  processor,
  orderId,
  buyerPublicKey,
  reporter,
  arbiter,
  price,
  shipping,
  metadata,
  ...params
}: SubmitOrderParamters) => {
  return processor.write.submit(
    [orderId, buyerPublicKey, reporter, arbiter, price, shipping, metadata],
    params
  );
};

type OrderActionParameters = SlimWriteContractParameters & {
  processor: Processor;
  orderId: string;
};

type ShipOrderParameters = OrderActionParameters & { shipments: Shipment[]; };

export const shipOrder = async ({
  processor,
  orderId,
  shipments,
  ...params
}: ShipOrderParameters) => {
  const [{ buyerPublicKey }, reporterPublicKey, arbiterPublicKey] = await Promise.all([
    getOrder({ processor, orderId }),
    processor.read.reporterPublicKey([]),
    processor.read.arbiterPublicKey([])
  ]);
  const data = JSON.stringify(shipments);
  const shipmentBuyer = encryptData({ data, publicKeyHex: buyerPublicKey as Hex });
  const shipmentReporter = encryptData({ data, publicKeyHex: reporterPublicKey as Hex });
  const shipmentArbiter = encryptData({ data, publicKeyHex: arbiterPublicKey as Hex });
  return processor.write.ship([orderId, shipmentBuyer, shipmentReporter, shipmentArbiter], params);
};

export const deliverOrder = async ({ processor, orderId, ...params }: OrderActionParameters) => {
  return processor.write.deliver([orderId], params);
};

export const failOrder = async ({ processor, orderId, ...params }: OrderActionParameters) => {
  return processor.write.fail([orderId], params);
};

export const completeOrder = async ({ processor, orderId, ...params }: OrderActionParameters) => {
  return processor.write.complete([orderId], params);
};

export const cancelOrder = async ({ processor, orderId, ...params }: OrderActionParameters) => {
  return processor.write.cancel([orderId], params);
};

export const abortOrder = async ({ processor, orderId, ...params }: OrderActionParameters) => {
  return processor.write.abort([orderId], params);
};

type DisputeOrderParamters = OrderActionParameters & { disputeUrl: string; };

export const disputeOrder = async ({ processor, orderId, disputeUrl, ...params }: DisputeOrderParamters) => {
  return processor.write.dispute([orderId, disputeUrl], params);
};

const getEncryptionKey = async ({
  walletClient,
  account
}: {
  walletClient: Client;
  account: Address;
}) => {
  const request = { method: 'eth_getEncryptionPublicKey', params: [account] } as any;
  return walletClient.request(request);
};
