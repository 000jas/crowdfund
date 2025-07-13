import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useContributions } from '../hooks/useContributions';
import { useWallet } from '../hooks/useWallet';
import { User, Shield, TrendingUp, Calendar, ExternalLink, Wallet, Network, Copy, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { user, profile } = useAuth();
  const { contributions, loading: contributionsLoading } = useContributions();
  const { 
    walletAddress, 
    balance, 
    network, 
    isCorrectNetwork, 
    isConnected, 
    connectWallet, 
    disconnectWallet, 
    switchToShardeum,
    updateBalance 
  } = useWallet();

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.success('Wallet address copied to clipboard!');
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const handleRefreshBalance = async () => {
    if (walletAddress) {
      await updateBalance(walletAddress);
      toast.success('Balance refreshed!');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Please sign in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account and view your contribution history.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {profile?.wallet_address ? 
                    `${profile.wallet_address.slice(0, 6)}...${profile.wallet_address.slice(-4)}` : 
                    user.email
                  }
                </h3>
                {profile?.is_verified && (
                  <div className="flex items-center justify-center space-x-1 mb-4">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-700 font-medium">Verified Donor</span>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {profile ? `${profile.total_donated.toFixed(2)} SHM` : '0 SHM'}
                  </div>
                  <div className="text-sm text-gray-500">Total Contributed</div>
                </div>
              </div>
            </div>

            {/* Wallet Connection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Wallet Connection</h4>
                {isConnected ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 font-medium">Connected</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Not Connected</span>
                )}
              </div>

              {isConnected ? (
                <div className="space-y-4">
                  {/* Wallet Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Address</label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-sm font-mono text-gray-700 break-all">
                          {walletAddress}
                        </p>
                      </div>
                      <button
                        onClick={handleCopyAddress}
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy address"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Wallet Balance */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Balance</label>
                      <button
                        onClick={handleRefreshBalance}
                        className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Refresh balance"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Wallet className="w-5 h-5 text-purple-600" />
                      <span className="text-lg font-semibold text-gray-900">{balance} SHM</span>
                    </div>
                  </div>

                  {/* Network Info */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Network</label>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Network className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">{network || 'Unknown'}</span>
                        {isCorrectNetwork ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      {!isCorrectNetwork && (
                        <button
                          onClick={switchToShardeum}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                    {!isCorrectNetwork && (
                      <p className="text-xs text-red-600 mt-1">
                        Please switch to Shardeum network for optimal experience
                      </p>
                    )}
                  </div>

                  {/* Disconnect Button */}
                  <button
                    onClick={disconnectWallet}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Connect your MetaMask wallet to view detailed wallet information and manage your profile.
                  </p>
                  <button
                    onClick={handleConnectWallet}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
                  >
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Quick Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Campaigns Backed</span>
                  <span className="font-medium">{contributions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Referral Code</span>
                  <span className="font-medium text-blue-600">{profile?.referral_code || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Raised</span>
                  <span className="font-medium text-green-600">{profile ? `${profile.total_raised.toFixed(2)} SHM` : '0 SHM'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium text-gray-600">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Donation History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Donation History</h3>
              {contributionsLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading contributions...</p>
                </div>
              ) : contributions.length > 0 ? (
                <div className="space-y-4">
                  {contributions.map((contribution) => (
                    <div key={contribution.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {contribution.campaign?.title || 'Unknown Campaign'}
                        </h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(contribution.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <ExternalLink className="w-4 h-4" />
                            <span className="font-mono">{contribution.transaction_hash.slice(0, 10)}...</span>
                          </div>
                        </div>
                        {contribution.referral_code && (
                          <div className="mt-1">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Ref: {contribution.referral_code}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">{contribution.amount.toFixed(2)} SHM</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No contributions yet</h3>
                  <p className="text-gray-600">Start contributing to campaigns to see your donation history here.</p>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {contributions.slice(0, 5).map((contribution) => (
                  <div key={contribution.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">Donated to</span> {contribution.campaign?.title || 'Unknown Campaign'}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(contribution.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-sm font-medium text-green-600">{contribution.amount.toFixed(2)} SHM</span>
                  </div>
                ))}
                {contributions.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;