import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './wagmi.config';
import Header from './components/Header';
import ProjectInfo from './components/ProjectInfo';
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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Header />
      <main className="container mx-auto px-0 py-8 grow max-w-7xl flex flex-row gap-6 items-start">
        {/* Left: Dashboard/Project Info */}
        <aside className="w-96 shrink-0 flex flex-col h-full">
          <ProjectInfo />
        </aside>
        {/* Center: User Portfolio/Actions */}
        <section className="flex-1 min-w-0">
          {isConnected ? (
            <UserDashboard />
          ) : (
            <div className="mt-12 text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-3xl mx-auto">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-600 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
                  </svg>
               </div>
               <h3 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
               <p className="text-gray-500 max-w-md mx-auto mb-8">Connect your wallet to view your dashboard, manage investments, and track your real-world asset portfolio.</p>
            </div>
          )}
        </section>
        {/* Right: Admin Panel */}
        <aside className="w-70 shrink-0 flex flex-col h-full">
          <AdminPanel />
        </aside>
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