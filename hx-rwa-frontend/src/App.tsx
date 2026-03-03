import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './wagmi.config';
import Header from './components/Header';
import { ProjectInfoHeader, ProjectInfoStats } from './components/ProjectInfoHeader';
import UserDashboard from './components/UserDashboard';
import AdminPanel from './components/AdminPanel';
import Footer from './components/Footer';
import { useAccount } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
//import { baseSepolia } from 'wagmi/chains';

const queryClient = new QueryClient();

function AppContent() {
  const { isConnected } = useAccount();
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
      <Header />
<main className="container mx-auto px-4 py-8 grow max-w-7xl border-t-2 border-yellow-400 
                 grid grid-cols-[auto_1fr_auto] gap-8 items-stretch">
  
  {/* 1. Wide Header: Fractional Cab Ownership */}
  <div className="col-span-2">
    <ProjectInfoHeader />
  </div>

  {/* 2. Admin Panel: Occupies full height of the right column */}
  <aside className="col-start-3 row-span-2 w-80 shrink-0 flex">
    <div className="w-full flex flex-col">
       <AdminPanel />
    </div>
  </aside>

  {/* 3. Stat Cards: Left column */}
  <aside className="col-start-1 row-start-2 w-64 shrink-0 flex flex-col">
    <div className="flex-1">
      <ProjectInfoStats />
    </div>
  </aside>

  {/* 4. Portfolio/Actions: Center column */}
  <section className="col-start-2 row-start-2 flex flex-col">
    {isConnected ? (
      <div className="flex flex-col flex-1">
        <UserDashboard />
      </div>
    ) : (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col justify-center">
                   <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-600 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
                      </svg>
                   </div>
                   <h3 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-8">Connect your wallet to track your portfolio.</p>
      </div>
    
            )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          <AppContent />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;