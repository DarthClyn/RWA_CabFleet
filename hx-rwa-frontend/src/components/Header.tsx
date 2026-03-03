import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Header() {
  return (
    <header className="bg-black border-b-2 border-yellow-400 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-black font-bold text-xl">
            <span className="inline-block">🚕</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-yellow-400 tracking-tight">RWA Cab Fleet</h1>
            <div className="text-xs text-yellow-200 font-medium leading-tight">Tokenized Real-World Asset Platform</div>
          </div>
        </div>
        <ConnectButton.Custom>
          {({ account, chain, openConnectModal, openAccountModal, openChainModal, mounted, authenticationStatus, balance }) => {
            const ready = mounted && authenticationStatus !== 'loading';
            const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');
            return (
              <div className="flex items-center gap-2">
                {!connected ? (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="bg-yellow-400 text-black font-semibold px-4 py-1 rounded hover:bg-yellow-500 transition"
                  >
                    Connect Wallet
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={openAccountModal}
                      className="bg-gray-900 text-white px-3 py-1 rounded font-mono text-sm border border-yellow-400 hover:bg-gray-800 transition"
                    >
                      {account.displayName}
                    </button>
                    {balance && (
                      <span className="text-white font-mono text-xs bg-gray-800 px-2 py-1 rounded border border-yellow-400">
                        {balance.formatted} {balance.symbol}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
}
