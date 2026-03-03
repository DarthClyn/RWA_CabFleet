
import { useState, useEffect } from 'react';
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
  // On first load, simulate once
  useEffect(() => {
    if (!sim) {
      // Simulate cab earnings using TVL as total volume
      const fleetTrips = randomInt(4000, 5000); // 10*30*15 = 4500 avg
      const totalVolume = Math.round(tvl); // Use TVL from dashboard
      const earnings = Math.round(totalVolume * (randomInt(8, 15) / 100));
      const runningCost = Math.round(totalVolume * (randomInt(1, 3) / 100));
      const net = earnings - runningCost;
      const price = (1_000_000 + net) / 1_000_000; // dummy new price logic
      setSim({ fleetTrips, totalVolume, earnings, runningCost, net, price });
      setNewPrice(price.toFixed(6));
    }
  }, [sim, tvl]);
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
    <div className="bg-white rounded-xl shadow-sm border-2 border-yellow-400 p-6 w-full max-w-xs mx-auto">
      <h2 className="text-xl font-bold mb-3">Admin Only Panel</h2>
      {/* Fulfill Deposit */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Fulfill Deposit (address)</label>
        <input type="text" value={fulfillAddress} onChange={e => setFulfillAddress(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="0x..." />
        <button onClick={handleFulfill} disabled={!fulfillAddress || isFulfilling}
          className="w-full font-medium py-2.5 rounded-lg transition-colors bg-yellow-300 border border-black text-black hover:bg-yellow-400 hover:text-black disabled:opacity-50">
          {isFulfilling ? 'Fulfilling...' : 'Fulfill Deposit'}
        </button>
        {fulfillError && <div className="text-red-600 text-xs mt-1">{fulfillError.message}</div>}
      </div>
      {/* Simulate Earnings */}
      <div className="mb-6">
        <button onClick={handleSimulate} className="w-full font-medium py-2.5 rounded-lg transition-colors bg-black hover:bg-yellow-400 hover:text-black text-yellow-400 border border-black mb-3">Simulate Monthly Fleet Earnings</button>
        <div className="bg-white rounded-xl border border-gray-200 p-2 mt-1">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b last:border-b-0 border-gray-200">
                <td className="text-gray-600 py-2 pl-3">Fleet Trips</td>
                <td className="text-right font-bold pr-3">{sim ? sim.fleetTrips : '-'}</td>
              </tr>
              <tr className="border-b last:border-b-0 border-gray-200">
                <td className="text-gray-600 py-2 pl-3">Earnings</td>
                <td className="text-right font-bold pr-3">{sim ? `$${sim.earnings.toLocaleString()}` : '-'}</td>
              </tr>
              <tr className="border-b last:border-b-0 border-gray-200">
                <td className="text-gray-600 py-2 pl-3">Investor Cost</td>
                <td className="text-right font-bold pr-3">{sim ? `$${sim.runningCost.toLocaleString()}` : '-'}</td>
              </tr>
              <tr className="border-b last:border-b-0 border-gray-200">
                <td className="text-gray-600 py-2 pl-3">Net This Month</td>
                <td className="text-right font-bold pr-3">{sim ? `$${sim.net.toLocaleString()}` : '-'}</td>
              </tr>
              <tr>
                <td className="text-gray-600 py-2 pl-3">New Price</td>
                <td className="text-right font-bold pr-3">{sim ? `$${Number(sim.price).toLocaleString(undefined, {minimumFractionDigits: 6, maximumFractionDigits: 6})}` : '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* Update Price */}
      <div>
        <label className="block text-sm font-medium mb-1">Update CAB Token Price</label>
        <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all" placeholder="New price (USDC)" />
        <button onClick={handleUpdatePrice} disabled={!newPrice || isUpdating}
          className="w-full font-medium py-2.5 rounded-lg transition-colors bg-yellow-300 border border-black text-black hover:bg-yellow-400 hover:text-black disabled:opacity-50">
          {isUpdating ? 'Updating...' : 'Update Price'}
        </button>
        {updateError && <div className="text-red-600 text-xs mt-1">{updateError.message}</div>}
      </div>
    </div>
  );
}
