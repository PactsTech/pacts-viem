import { narrow } from 'abitype';
import { Hex } from 'viem';
// eslint-disable-next-line max-len
import {
  abi as abiJson,
  bytecode as bytecodeRaw
} from '@pactstech/contracts/artifacts/contracts/OrderProcessorErc20.sol/OrderProcessorErc20.json';

export const abi = narrow(abiJson);
export const bytecode = bytecodeRaw as Hex;
