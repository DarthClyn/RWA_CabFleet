
import { useState } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { addresses, tokenAbi, vaultAbi } from '../contracts';

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


export default function AdminPanel() {
  const [fulfillAddress, setFulfillAddress] = useState('');
  const [sim, setSim] = useState<any>(null);
  const [newPrice, setNewPrice] = useState('');
  const { writeContract: fulfillDeposit, isPending: isFulfilling, error: fulfillError } = useWriteContract();
  const { writeContract: updateSharePrice, isPending: isUpdating, error: updateError } = useWriteContract();

  // Get TVL (total volume) from CAB token
  const { data: sharePrice } = useReadContract({ address: addresses.token as `0x${string}`, abi: tokenAbi, functionName: 'sharePrice' });
  const { data: totalSupply } = useReadContract({ address: addresses.token as `0x${string}`, abi: tokenAbi, functionName: 'totalSupply' });
  const price = sharePrice ? Number(sharePrice) / 1e6 : 1;
  const tvl = totalSupply ? (Number(totalSupply) / 1e18) * price : 0;

  const handleFulfill = () => {
    if (!fulfillAddress) return;
    fulfillDeposit({
      address: addresses.vault as `0x${string}`,
      abi: vaultAbi,
      functionName: 'fulfillDeposit',
      args: [fulfillAddress as `0x${string}`],
      gas: 200000n
    });
  };

  const handleSimulate = () => {
    // Simulate cab earnings using TVL as total volume
    const fleetTrips = randomInt(4000, 5000); // 10*30*15 = 4500 avg
    const totalVolume = Math.round(tvl); // Use TVL from dashboard
    const earnings = Math.round(totalVolume * (randomInt(8, 15) / 100));
    const runningCost = Math.round(totalVolume * (randomInt(1, 3) / 100));
    const net = earnings - runningCost;
    const price = (1_000_000 + net) / 1_000_000; // dummy new price logic
    setSim({ fleetTrips, totalVolume, earnings, runningCost, net, price });
    setNewPrice(price.toFixed(6));
  };

  const handleUpdatePrice = () => {
    if (!newPrice) return;
    // Convert to 1e6 USDC decimals
    const priceInt = Math.round(Number(newPrice) * 1_000_000);
    updateSharePrice({
      address: addresses.token as `0x${string}`,
      abi: tokenAbi,
      functionName: 'updateSharePrice',
      args: [BigInt(priceInt)],
      gas: 100000n
    });
  };

  return (
    <aside className="w-full max-w-xs bg-gray-50 border-l border-gray-200 p-3">
      <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
      <div className="mb-8">
        <label className="block text-sm font-medium mb-1">Fulfill Deposit (address)</label>
        <input type="text" value={fulfillAddress} onChange={e => setFulfillAddress(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-2" placeholder="0x..." />
        <button onClick={handleFulfill} disabled={!fulfillAddress || isFulfilling}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50">{isFulfilling ? 'Fulfilling...' : 'Fulfill Deposit'}</button>
        {fulfillError && <div className="text-red-600 text-xs mt-1">{fulfillError.message}</div>}
      </div>
      <div className="mb-8">
        <button onClick={handleSimulate} className="w-full bg-green-600 text-white py-2 rounded mb-2">Simulate Cab Earnings</button>
        {sim && (
          <table className="w-full text-sm border mt-2 bg-white">
            <tbody>
              <tr><td>Fleet Trips</td><td className="text-right">{sim.fleetTrips}</td></tr>
              <tr><td>Total Volume</td><td className="text-right">${sim.totalVolume.toLocaleString()}</td></tr>
              <tr><td>Earnings</td><td className="text-right">${sim.earnings.toLocaleString()}</td></tr>
              <tr><td>Running Cost</td><td className="text-right">${sim.runningCost.toLocaleString()}</td></tr>
              <tr className="font-bold"><td>Net This Month</td><td className="text-right">${sim.net.toLocaleString()}</td></tr>
              <tr className="font-bold"><td>New Price</td><td className="text-right">${sim.price}</td></tr>
            </tbody>
          </table>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Update CAB Token Price</label>
        <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-2" placeholder="New price (USDC)" />
        <button onClick={handleUpdatePrice} disabled={!newPrice || isUpdating}
          className="w-full bg-purple-600 text-white py-2 rounded disabled:opacity-50">{isUpdating ? 'Updating...' : 'Update Price'}</button>
        {updateError && <div className="text-red-600 text-xs mt-1">{updateError.message}</div>}
      </div>
    </aside>
  );
}
