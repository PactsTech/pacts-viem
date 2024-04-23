import {
  getContract,
  Client,
  PublicClient,
  WalletClient,
  GetContractParameters,
  DeployContractParameters,
  Address
} from 'viem';
import { abi, bytecode } from './contract';
import { GetContractReturnType } from 'viem';

export type GetProcessorParameters = Omit<
  GetContractParameters,
  'client' | 'abi'
> & {
  publicClient: PublicClient;
  walletClient: WalletClient;
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
  const { publicClient, walletClient, address, ...rest } = params;
  return getContract({ ...rest, client: { public: publicClient, wallet: walletClient }, abi, address });
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
