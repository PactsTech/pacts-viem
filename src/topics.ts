import { Address, Hex, getEventSignature, keccak256, pad, toHex } from 'viem';
import { AbiEvent } from 'abitype';
import { abi } from './contract';

export type ProcessorEvent = 'Deployed';
export type OrderEvent =
  'Submitted'
  | 'Shipped'
  | 'Delivered'
  | 'Completed'
  | 'Failed'
  | 'Canceled'
  | 'Aborted'
  | 'Disputed'
  | 'Resolved';

export type TopicMap = { [topic: Hex]: string };

export const deployedEvent = abi.find((event) => event.name === 'Deployed') as AbiEvent;
export const submittedEvent = abi.find((event) => event.name === 'Submitted') as AbiEvent;
export const shippedEvent = abi.find((event) => event.name === 'Shipped') as AbiEvent;
export const deliveredEvent = abi.find((event) => event.name === 'Delivered') as AbiEvent;
export const completedEvent = abi.find((event) => event.name === 'Completed') as AbiEvent;
export const failedEvent = abi.find((event) => event.name === 'Failed') as AbiEvent;
export const canceledEvent = abi.find((event) => event.name === 'Canceled') as AbiEvent;
export const abortedEvent = abi.find((event) => event.name === 'Aborted') as AbiEvent;
export const disputedEvent = abi.find((event) => event.name === 'Disputed') as AbiEvent;
export const resolvedEvent = abi.find((event) => event.name === 'Resolved') as AbiEvent;

export const orderEvents = Object.freeze([
  submittedEvent,
  shippedEvent,
  deliveredEvent,
  completedEvent,
  failedEvent,
  canceledEvent,
  abortedEvent,
  disputedEvent,
  resolvedEvent
]);

export const toTopics = (events: AbiEvent | readonly [AbiEvent]) => (Array.isArray(events) ? events : [events])
  .map((event) => getEventSignature(event))
  .map((signature) => keccak256(toHex(signature)));

export const deployedTopic = toTopics(deployedEvent as AbiEvent)[0];
export const orderTopics = toTopics(orderEvents as [AbiEvent]);

export const generateOrderTopics = ({ address }: { address: Address }) => {
  const padded = pad(address);
  return [orderTopics, null, padded, null];
};

export const generateProcessorTopics = ({ address }: { address: Address }) => {
  const padded = pad(address);
  return [deployedTopic, padded, null, null];
};

const map = [deployedEvent, ...orderEvents].reduce((acc, event) => {
  const [topic] = toTopics(event);
  const name = event?.name;
  if (!name) {
    return acc;
  }
  return { ...acc, [topic]: name };
}, {} as TopicMap);

export const topicMap = Object.freeze(map);