import {
  getContract,
  Client,
  WalletClient,
  GetContractParameters,
  DeployContractParameters,
  Address
} from 'viem';
import { abi, bytecode } from './contract';
import { GetContractReturnType } from 'viem';

export type GetProcessorParameters = Omit<GetContractParameters, 'abi'> & {
  client: Client;
};

export type DeployProcessorParameters = Omit<DeployContractParameters, 'abi' | 'bytecode'> & {
  walletClient: WalletClient;
  storeName: string;
  cancelBlocks: bigint;
  disputeBlocks: bigint;
  reporter: Address;
  reporterPublicKey: string;
  arbiter: Address;
  arbiterPublicKey: string;
  token: Address;
};

export type Processor = GetContractReturnType<typeof abi, Client, Address>;

export const getProcessor = (params: GetProcessorParameters): Processor => {
  const { client, address, ...rest } = params;
  return getContract({ ...rest, client, abi, address });
};

export const deployProcessor = async ({
  walletClient,
  chain,
  account,
  storeName,
  cancelBlocks,
  disputeBlocks,
  reporter,
  reporterPublicKey,
  arbiter,
  arbiterPublicKey,
  token
}: DeployProcessorParameters) => {
  return walletClient.deployContract({
    chain,
    account,
    abi,
    bytecode,
    args: [
      storeName,
      cancelBlocks,
      disputeBlocks,
      reporter,
      reporterPublicKey,
      arbiter,
      arbiterPublicKey,
      token
    ]
  });
};
