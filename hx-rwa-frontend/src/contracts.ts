

// Dynamically load addresses from deployed.json
import deployed from '../../deployed.json';

export const addresses = {
  usdc: deployed.USDC,
  vault: deployed.RWAAsyncVault,
  token: deployed.CabShareToken,
  identity: deployed.IdentityRegistry,
};


export const usdcAbi = [
  { name: 'approve', type: 'function', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'balanceOf', type: 'function', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'allowance', type: 'function', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'decimals', type: 'function', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'mint', type: 'function', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [] },
];

export const vaultAbi = [
  { name: 'requestDeposit', type: 'function', inputs: [{ name: 'usdcAmount', type: 'uint256' }], outputs: [] },
  { name: 'fulfillDeposit', type: 'function', inputs: [{ name: 'user', type: 'address' }], outputs: [] },
  { name: 'cancelDeposit', type: 'function', inputs: [], outputs: [] },
  { name: 'deposits', type: 'function', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'uint256' }, { type: 'uint256' }, { type: 'uint8' }] },
  { name: 'requestRedeem', type: 'function', inputs: [{ name: 'tokenAmount', type: 'uint256' }], outputs: [] },
  { name: 'fulfillRedeem', type: 'function', inputs: [{ name: 'user', type: 'address' }], outputs: [] },
  { name: 'cancelRedeem', type: 'function', inputs: [], outputs: [] },
  { name: 'redeems', type: 'function', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'uint256' }, { type: 'uint256' }, { type: 'uint8' }] },
  { name: 'lockSeconds', type: 'function', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'setLockSeconds', type: 'function', inputs: [{ name: 'newLock', type: 'uint256' }], outputs: [] },
];

export const tokenAbi = [
  { name: 'balanceOf', type: 'function', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'sharePrice', type: 'function', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'totalSupply', type: 'function', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'mint', type: 'function', inputs: [{ name: 'to', type: 'address' }, { name: 'usdcAmount', type: 'uint256' }], outputs: [] },
  { name: 'burnFromVault', type: 'function', inputs: [{ name: 'from', type: 'address' }, { name: 'tokenAmount', type: 'uint256' }], outputs: [] },
  { name: 'updateSharePrice', type: 'function', inputs: [{ name: 'newPrice', type: 'uint256' }], outputs: [] },
  { name: 'setVault', type: 'function', inputs: [{ name: '_vault', type: 'address' }], outputs: [] },
  { name: 'forceTransfer', type: 'function', inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [] },
];

export const identityAbi = [
  { name: 'isVerified', type: 'function', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'bool' }] },
  { name: 'updateIdentity', type: 'function', inputs: [{ name: 'account', type: 'address' }, { name: 'status', type: 'bool' }], outputs: [] },
  { name: 'verifyMultiple', type: 'function', inputs: [{ name: 'accounts', type: 'address[]' }, { name: 'status', type: 'bool' }], outputs: [] },
  { name: 'owner', type: 'function', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'transferOwnership', type: 'function', inputs: [{ name: 'newOwner', type: 'address' }], outputs: [] },
];
