pacts-viem
============

pacts-viem is a simple tool set of helper functions to interact with [pacts](https://pacts.tech) contracts.

### Installation

Install `@pactstech/pacts-viem` and its peer dependencies:

```sh
npm i viem@^2.9.0 abitype@^1.0.0 @pactstech/pacts-viem
```

### Setting up Viem

You'll need to setup viem clients in order to use pacts-viem order actions. For more details, visit [viem's docs](https://viem.sh/docs/getting-started.html).

```js
import { createPublicClient, createWalletClient, custom, publicActions } from 'viem';

// viem client setup
const transport = custom(window.ethereum);
const publicClient = createPublicClient({ transport });
const walletClient = createWalletClient({ transport }).extend(publicActions);
```

### Getting a Processor Instance

To perform any order actions, you'll need a processor instance:

```js
import * as viemChains from 'viem/chains';
import { getProcessor } from '@pactstech/pacts-viem';

// get processor instance
const chain = viemChains.arbitrum;
const address = '0x1234567890123456789012345678901234567890';
const processor = getProcessor({ chain, address, client: walletClient });
```

### Submitting an Order

Using the clients & processor setup above, we can submit an order:

```js
import { setupOrder, submitOrder } from '@pactstech/pacts-viem';

// pacts order details
const orderId = 'dbdf2d90-b66e-4f39-bec3-388f76eadb42';
const price = '100.00';
const shipping = '10.00';
const metadata = { itemName: 'bicycle' };

// submits erc20 approvals, converts parameters
const args = await setupOrder({
  chain,
  publicClient,
  walletClient,
  processor,
  orderId,
  price,
  shipping,
  metadata
});

// submit order using args
const hash = await submitOrder({ chain, processor, ...args });
const receipt = await publicClient.waitForTransactionReceipt({ chain, hash });
if (receipt.status !== 'success') {
  throw new Error('transaction failed');
}
console.log({ receipt });
```

### Shipping an Order

When an order is ready to ship, call `shipOrder`:

```js
import { shipOrder } from '@pactstech/pacts-viem';

// pacts order details
const orderId = '1';
const carrier = 'usps';
const trackingNumber = '9102969010383081813033';
const shipments = [[carrier, trackingNumber]];

// ship order and wait for receipt
const hash = await shipOrder({ chain, processor, orderId, shipments });
const receipt = await publicClient.waitForTransactionReceipt({ chain, hash });
if (receipt.status !== 'success') {
  throw new Error(`Transaction failed: ${receipt.transactionHash}`);
}
console.log({ receipt });
```

### Completing an Order

Once an order has been delivered and `disputeBlocks` have passed, you can complete an order and retrieve your funds:

```js
import { completeOrder } from '@pactstech/pacts-viem';

// pacts order details
const orderId = '1';

// ship order and wait for receipt
const hash = await completeOrder({ chain, processor, orderId });
const receipt = await publicClient.waitForTransactionReceipt({ chain, hash });
if (receipt.status !== 'success') {
  throw new Error(`Transaction failed: ${receipt.transactionHash}`);
}
console.log({ receipt });
```