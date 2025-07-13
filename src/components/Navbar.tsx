import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, User, Vote, Share2, Home, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../hooks/useWallet';
import toast from 'react-hot-toast';

interface NavbarProps {
  onAuthClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onAuthClick }) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { walletAddress, isConnected, connectWallet, isConnecting, disconnectWallet } = useWallet();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/campaigns', label: 'Campaigns', icon: BarChart3 },
    { path: '/governance', label: 'Governance', icon: Vote },
    { path: '/referrals', label: 'Referrals', icon: Share2 },
    { path: '/profile', label: 'Profile', icon: User }
  ];

  const handleSignOut = async () => {
    try {
      console.log('Sign out button clicked');
      const loadingToast = toast.loading('Signing out...');
      await signOut();
      toast.success('Signed out successfully!', { id: loadingToast });
      console.log('Sign out completed successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      toast.error(`Sign out failed: ${errorMessage}`);
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CF</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                CrowdFund
              </span>
            </Link>

            <div className="hidden md:flex space-x-6">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === path
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {isConnected ? (
                  <>
                    <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">
                        {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                      </span>
                    </div>
                    <button
                      onClick={disconnectWallet}
                      className="flex items-center space-x-2 px-2 py-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Wallet className="w-4 h-4" />
                      <span className="text-xs font-medium">Disconnect</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="flex items-center space-x-2 px-3 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50"
                  >
                    <Wallet className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                    </span>
                  </button>
                )}
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  data-testid="signout-button"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;