import abi from 'erc-20-abi';
import {
  Address,
  PublicClient,
  WalletClient,
  WriteContractParameters,
  WriteContractReturnType
} from 'viem';

export type ApproveAllowanceErc20Parameters = Omit<
  WriteContractParameters,
  'abi' | 'functionName' | 'args'
> & {
  publicClient: PublicClient;
  walletClient: WalletClient;
  account: Address;
  address: Address;
  spender: Address;
  amount: bigint;
};

export const getDecimalsErc20 = async ({
  publicClient,
  address
}: {
  publicClient: PublicClient;
  address: Address;
}) => {
  const response = await publicClient.readContract({
    address,
    abi,
    functionName: 'decimals',
    args: []
  });
  return BigInt(response as string);
};

export const approveAllowanceErc20 = async (
  params: ApproveAllowanceErc20Parameters
): Promise<WriteContractReturnType | undefined> => {
  const { publicClient, walletClient, chain, address, account, spender, amount } = params;
  const allowanceHex = await publicClient.readContract({
    address,
    abi,
    functionName: 'allowance',
    args: [account, spender]
  });
  const allowance = BigInt(allowanceHex as string);
  const difference = amount - allowance;
  if (difference <= 0) {
    return;
  }
  return walletClient.writeContract({
    chain,
    account,
    address,
    abi,
    functionName: 'approve',
    args: [spender, difference]
  });
};
