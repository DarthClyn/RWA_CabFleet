import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import { addresses, usdcAbi, vaultAbi, tokenAbi, identityAbi } from '../contracts';

export default function UserDashboard() {
  const { address } = useAccount();
  //const { data: walletClient } = useWalletClient();
  //const publicClient = usePublicClient();
  const [depositAmount, setDepositAmount] = useState('');
  const [redeemAmount, setRedeemAmount] = useState('');
  const [investStep, setInvestStep] = useState<'idle' | 'approving' | 'depositing'>('idle');

  const { data: isVerified, refetch: refetchVerified } = useReadContract({ address: addresses.identity as `0x${string}`, abi: identityAbi, functionName: 'isVerified', args: [address as `0x${string}`] });
  const { data: balance, refetch: refetchBalance } = useReadContract({ address: addresses.token as `0x${string}`, abi: tokenAbi, functionName: 'balanceOf', args: [address as `0x${string}`] });
  // Get deposit request status for user
  const { data: depositReq, refetch: refetchDepositReq } = useReadContract({ address: addresses.vault as `0x${string}`, abi: vaultAbi, functionName: 'deposits', args: [address as `0x${string}`] });
  const { data: usdcBalance, refetch: refetchUsdcBalance } = useReadContract({ address: addresses.usdc as `0x${string}`, abi: usdcAbi, functionName: 'balanceOf', args: [address as `0x${string}`] });
  const { data: allowance, refetch: refetchAllowance } = useReadContract({ address: addresses.usdc as `0x${string}`, abi: usdcAbi, functionName: 'allowance', args: [address as `0x${string}`, addresses.vault as `0x${string}`] });

  const { writeContract: approve, isPending: isApprovePending, isSuccess: isApproveSuccess, error: approveError } = useWriteContract();
  const { writeContract: deposit, isPending: isDepositPending, isSuccess: isDepositSuccess, error: depositError } = useWriteContract(); 
  const { writeContract: redeem } = useWriteContract();

  // Auto-deposit after approve is confirmed  
  useEffect(() => {
    if (isApproveSuccess && investStep === 'approving') {
      // Refresh allowance after approve
      refetchAllowance();
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setInvestStep('depositing');
        deposit({ 
          address: addresses.vault as `0x${string}`, 
          abi: vaultAbi, 
          functionName: 'requestDeposit', 
          args: [parseUnits(depositAmount, 6)]
        });
      }, 100);
    }
  }, [isApproveSuccess, investStep, deposit, depositAmount, refetchAllowance]);

  // Refresh balances after successful deposit
  useEffect(() => {
    if (isDepositSuccess && investStep === 'depositing') {
      // Refresh all balances after successful deposit request
      refetchBalance();
      refetchUsdcBalance();
      refetchAllowance();
    }
  }, [isDepositSuccess, investStep, refetchBalance, refetchUsdcBalance, refetchAllowance]);

  // Reset state when transactions complete
  useEffect(() => {
    if (!isApprovePending && !isDepositPending && investStep !== 'idle') {
      const timer = setTimeout(() => {
        setInvestStep('idle');
        // Final refresh after state reset
        refetchBalance();
        refetchUsdcBalance();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isApprovePending, isDepositPending, investStep, refetchBalance, refetchUsdcBalance]);

  if (!isVerified) return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-8 rounded-r-md">
      <div className="flex">
        <div className="shrink-0">
          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            Account not verified. Please complete KYC process to start investing in the platform.
          </p>
        </div>
      </div>
    </div>
  );

  const handleRedeem = () => {
    if (!redeemAmount) return;
    redeem({
      address: addresses.vault as `0x${string}`,
      abi: vaultAbi,
      functionName: 'requestRedeem',
      args: [parseUnits(redeemAmount, 18)],
      gas: 200000n
    });
  };

  const handleInvest = () => {
    if (!depositAmount) return;
    // Check for pending deposit
    if (depositReq && Array.isArray(depositReq) && Number(depositReq[2]) === 1) {
      alert('You already have a pending deposit request. Please wait for admin to fulfill it before making a new deposit.');
      return;
    }
    const amount = parseUnits(depositAmount, 6);
    const currentAllowance = BigInt(allowance?.toString() || '0');
    if (currentAllowance >= amount) {
      setInvestStep('depositing');
      deposit({
        address: addresses.vault as `0x${string}`,
        abi: vaultAbi,
        functionName: 'requestDeposit',
        args: [amount],
        gas: 200000n
      });
      return;
    }
    setInvestStep('approving');
    approve({
      address: addresses.usdc as `0x${string}`,
      abi: usdcAbi,
      functionName: 'approve',
      args: [addresses.vault as `0x${string}`, amount]
    });
  };

  return (
    <section className="my-1">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>Your Portfolio</span>
        <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Connected</span>
      </h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Portfolio Overview</h3>
          <button 
            onClick={() => {
              refetchBalance();
              refetchUsdcBalance(); 
              refetchAllowance();
            }}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-lg transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Your Investment</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{balance ? Number(balance) / 1e18 : 0}</span>
              <span className="text-lg text-gray-600">CAB</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">≈ ${(Number(balance) / 1e18 * 1).toFixed(2)} USDC</p>
          </div>
          <div className="sm:border-l sm:border-gray-100 sm:pl-8">
            <p className="text-sm font-medium text-gray-500 mb-1">Wallet Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{usdcBalance ? Number(usdcBalance) / 1e6 : 0}</span>
              <span className="text-lg text-gray-600">USDC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info tip icon */}
      <div className="flex justify-end mb-2">
        <div className="relative group">
          <button
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 focus:outline-none"
            tabIndex={0}
            aria-label="How it works"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <div className="absolute right-0 z-10 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-gray-800 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto transition-opacity duration-200">
            <strong>How it works:</strong> Your deposit creates a request that requires admin approval. Once approved by the admin, CAB tokens will be minted to your wallet. This typically takes a few minutes to process.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deposit Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-900">Invest Capital</h3>
            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">Buy Shares</span>
          </div>
          
          <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
             <span className="text-sm text-blue-800">Available to Invest:</span>
             <span className="font-bold text-blue-900">{usdcBalance ? Number(usdcBalance) / 1e6 : 0} USDC</span>
          </div>

          {/* Show error messages if any */}
          {(approveError || depositError) && (
            <div className="mb-4 bg-red-50 p-3 rounded-lg border border-red-100">
              <div className="text-sm text-red-800">
                <strong>Transaction Error:</strong>
                <br />
                {approveError?.message || depositError?.message}
              </div>
            </div>
          )}

          {/* Show success message after deposit request */}
          {isDepositSuccess && investStep === 'idle' && (
            <div className="mb-4 bg-green-50 p-3 rounded-lg border border-green-100">
              <div className="text-sm text-green-800">
                <strong>Deposit Request Submitted!</strong>
                <br />
                Your deposit request is pending admin approval. CAB tokens will be minted once processed.
              </div>
            </div>
          )}

          <div className="space-y-4">
            {depositReq && Array.isArray(depositReq) && Number(depositReq[2]) === 1 && (
              <div className="mb-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-yellow-800">
                <strong>Pending deposit request:</strong> You already have a pending deposit. Please wait for admin to fulfill it before making a new deposit.
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USDC)</label>
              <input 
                type="number" 
                value={depositAmount} 
                onChange={(e) => setDepositAmount(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                placeholder="0.00" 
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                 onClick={handleInvest}
                 disabled={!depositAmount || investStep !== 'idle' || isApprovePending || isDepositPending || (depositReq && Array.isArray(depositReq) && Number(depositReq[2]) === 1)}
                 className={`w-full font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 
                   ${(!depositAmount || investStep !== 'idle' || isApprovePending || isDepositPending || (depositReq && Array.isArray(depositReq) && Number(depositReq[2]) === 1)) 
                     ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                     : 'bg-green-600 hover:bg-green-700 text-white shadow-green-200'}`}
              >
                {investStep === 'idle' && (
                  <span>Invest USDC & Mint CAB</span>
                )}
                {investStep === 'approving' && (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Approving USDC...</span>
                  </>
                )}
                {investStep === 'depositing' && (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Investing & Minting...</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Redeem Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-900">Redeem Earnings</h3>
            <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded">Sell Shares</span>
          </div>

          <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center">
             <span className="text-sm text-gray-600">Available to Redeem:</span>
             <span className="font-bold text-gray-900">{balance ? Number(balance) / 1e18 : 0} CAB</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (CAB)</label>
              <input 
                type="number" 
                value={redeemAmount} 
                onChange={(e) => setRedeemAmount(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all" 
                placeholder="0.00" 
              />
            </div>
            
            <div className="pt-2">
              <button 
                onClick={handleRedeem} 
                disabled={!redeemAmount}
                className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 font-medium py-2.5 px-4 rounded-lg transition-all"
              >
                Request Redemption
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
