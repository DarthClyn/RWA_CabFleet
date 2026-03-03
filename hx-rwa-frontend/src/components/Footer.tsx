export default function Footer() {
  return (
    <footer className="bg-black text-white py-8 mt-auto border-t border-yellow-400">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-gray-400 font-medium tracking-wide">
          &copy; 2026 HX Cab Fleet RWA
        </p>
        <div className="flex justify-center items-center gap-3 mt-3 text-xs text-gray-500 uppercase tracking-widest">
            <span>Base Sepolia</span>
            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
            <span>RWA Tokenization</span>
            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
            <span>Testnet Only</span>
        </div>
      </div>
    </footer>
  );
}
