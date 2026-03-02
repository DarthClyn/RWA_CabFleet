import { useReadContract } from 'wagmi';
import { addresses, tokenAbi } from '../contracts';

export default function ProjectInfo() {
  const { data: sharePrice } = useReadContract({ address: addresses.token as `0x${string}`, abi: tokenAbi, functionName: 'sharePrice' });
  const { data: totalSupply } = useReadContract({ address: addresses.token as `0x${string}`, abi: tokenAbi, functionName: 'totalSupply' });

  const price = sharePrice ? Number(sharePrice) / 1e6 : 1;
  const tvl = totalSupply ? (Number(totalSupply) / 1e18) * price : 0;

  const stats = [
    { label: "Share Price", value: `$${price.toFixed(2)}`, sub: "USDC per token" },
    { label: "Total TVL", value: `$${tvl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: "Assets under management" },
    { label: "Est. APR", value: "8-12%", sub: "Projected yields from rides" },
    { label: "Fleet Size", value: "10 Cabs", sub: "Active vehicles" }
  ];

  return (
    <section className="h-full w-full pt-1 pb-4 pr-2 pl-0 flex flex-col justify-start">
      <div className="mb-4 text-left">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Fractional Cab Ownership</h2>
        <p className="text-sm text-gray-600">
          Invest in a real-world fleet of taxicabs. Earn passive income from daily ride revenues distributed directly to your wallet.
        </p>
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-0.5">{stat.label}</p>
            <p className="text-lg font-bold text-gray-900 mb-0.5">{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
