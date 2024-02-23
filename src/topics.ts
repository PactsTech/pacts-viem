import { Address, getEventSignature, keccak256, pad, toHex } from 'viem';
import { abi } from './contract';
import { AbiEvent } from 'abitype';

export const deployedEvent = abi.find((event) => event.name === 'Deployed');
export const submittedEvent = abi.find((event) => event.name === 'Submitted');
export const shippedEvent = abi.find((event) => event.name === 'Shipped');
export const deliveredEvent = abi.find((event) => event.name === 'Delivered');
export const completedEvent = abi.find((event) => event.name === 'Completed');
export const failedEvent = abi.find((event) => event.name === 'Failed');
export const disputedEvent = abi.find((event) => event.name === 'Disputed');

export const orderEvents = Object.freeze([
  submittedEvent,
  shippedEvent,
  deliveredEvent,
  completedEvent,
  failedEvent,
  disputedEvent,
]);

export const toTopics = (events: AbiEvent | readonly [AbiEvent]) => (Array.isArray(events) ? events : [events])
  .map((event) => getEventSignature(event))
  .map((signature) => keccak256(toHex(signature)));

export const deployedTopic = toTopics(deployedEvent as any)[0];
export const orderTopics = toTopics(orderEvents as any);

export const generateOrderTopics = ({ address }: { address: Address }) => {
  const padded = pad(address);
  return [orderTopics, null, padded, null];
};

export const generateProcessorTopics = ({ address }: { address: Address }) => {
  const padded = pad(address);
  return [deployedTopic, padded, null, null];
};

const map = [deployedEvent, ...orderEvents].reduce((acc, event) => {
  const [topic] = toTopics(event as any);
  const name = event?.name?.toLowerCase();
  if (!name) {
    return acc;
  }
  return { ...acc, [topic]: name };
}, {});

export const topicMap = Object.freeze(map);