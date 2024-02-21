import { getContract, PublicClient, WalletClient, GetContractParameters, DeployContractParameters, Address } from 'viem';
import { abi, bytecode } from './contract';
import { GetContractReturnType } from 'viem';

export type GetProcessorParameters = Omit<GetContractParameters, 'publicClient' | 'walletClient' | 'abi'> & {
  publicClient?: PublicClient,
  walletClient?: WalletClient,
};

export type DeployProcessorParameters = Omit<DeployContractParameters, 'abi' | 'bytecode'> & {
  walletClient: WalletClient,
  storeName: string,
  reporter: Address,
  reporterPublicKey: string,
  arbiter: Address,
  arbiterPublicKey: string,
  token: Address
};

export type Processor = GetContractReturnType<typeof abi, PublicClient, WalletClient, Address>

export const getProcessor = (params: GetProcessorParameters): Processor => {
  const { publicClient, walletClient, address, ...rest } = params;
  return getContract({ ...rest, publicClient, walletClient, abi, address });
};

export const deployProcessor = async ({
  walletClient,
  chain,
  account,
  storeName,
  reporter,
  reporterPublicKey,
  arbiter,
  arbiterPublicKey,
  token,
}: DeployProcessorParameters) => {
  return walletClient.deployContract({
    chain,
    account,
    abi,
    bytecode,
    args: [storeName, reporter, reporterPublicKey, arbiter, arbiterPublicKey, token]
  });
};