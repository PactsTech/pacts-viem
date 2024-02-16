import abi from 'erc-20-abi';

export const getDecimals = async ({ publicClient, address }) => {
  const response = await publicClient.readContract({
    address,
    abi,
    functionName: 'decimals',
    args: []
  });
  return BigInt(response);
};

export const approveAllowance = async ({
  publicClient,
  walletClient,
  account,
  address,
  amount,
  ...params
}) => {
  const allowanceHex = await publicClient.readContract({
    address,
    abi,
    functionName: 'allowance',
    args: [account]
  });
  const allowance = BigInt(allowanceHex);
  const difference = amount - allowance;
  if (difference <= 0) {
    return;
  }
  return walletClient.writeContract({
    ...params,
    address,
    abi,
    function: 'approve',
    args: [address, difference]
  });
};