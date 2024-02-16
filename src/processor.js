import { getContract } from 'viem';
// eslint-disable-next-line max-len
import { abi, bytecode } from '@pactstech/contracts/artifacts/contracts/OrderProcessorErc20.sol/OrderProcessorErc20.json';

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

export const getToken = async ({ publicClient, address }) => {
  return publicClient.readContract({ address, abi, functionName: 'token', args: [] });
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