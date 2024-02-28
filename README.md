pacts-viem
============

pacts-viem is a simple tool set of helper functions to interact with [pacts](https://pacts.tech) contracts.

### Installation

```sh
npm i @pactstech/pacts-viem
```

### Submitting an Order

```js
import { createPublicClient, createWalletClient, custom } from 'viem';
import { getProcessor, setupOrder, submitOrder } from '@pactstech/pacts-viem';

// viem client setup
const transport = custom(window.ethereum);
const publicClient = createPublicClient({ chain, transport });
const walletClient = createWalletClient({ chain, transport });

// get processor instance
const address = '0xad26caf683334cbe5aa388c2278265c35a714f7a';
const processor = getProcessor({ address, publicClient, walletClient });

// pacts order details
const orderId = 'dbdf2d90-b66e-4f39-bec3-388f76eadb42';
const price = 100n;
const shipping = 10n;
const metadata = { itemName: 'bicycle' };

// submits erc20 approvals, converts parameters
const args = await setupOrder({
  publicClient,
  walletClient,
  processor,
  orderId,
  price,
  shipping,
  metadata
});

// submit order using args
const hash = await submitOrder({ processor, ...args });
const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (receipt.status !== 'success') {
  throw new Error('transaction failed');
}

console.log({ receipt });
```