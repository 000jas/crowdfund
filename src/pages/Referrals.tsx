import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Copy, Gift, TrendingUp, Users, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const Referrals: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const { user, profile } = useAuth();
  
  const referralLink = profile?.referral_code 
    ? `https://crowdfund.app/ref/${profile.referral_code}`
    : '';

  const handleCopyLink = () => {
    if (!referralLink) {
      toast.error('No referral code available');
      return;
    }
    
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const referralStats = [
    { 
      label: 'Total Referrals', 
      value: '0', 
      icon: Users, 
      color: 'blue',
      description: 'People who used your referral code'
    },
    { 
      label: 'Earnings', 
      value: '0 SHM', 
      icon: TrendingUp, 
      color: 'green',
      description: 'Total earnings from referrals'
    },
    { 
      label: 'Tokens Earned', 
      value: '0', 
      icon: Gift, 
      color: 'purple',
      description: 'Platform tokens earned'
    },
    { 
      label: 'NFTs Earned', 
      value: '0', 
      icon: Award, 
      color: 'orange',
      description: 'NFT rewards collected'
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Please sign in to view your referrals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Referrals</h1>
          <p className="text-gray-600">Share your referral code and earn rewards when others contribute to campaigns.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Referral Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {referralStats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{stat.label}</h3>
                  <p className="text-sm text-gray-600">{stat.description}</p>
                </div>
              ))}
            </div>

            {/* Referral Link */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Link</h3>
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-sm font-mono text-gray-700 break-all">
                    {referralLink || 'No referral code available'}
                  </p>
                </div>
                <button
                  onClick={handleCopyLink}
                  disabled={!referralLink}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Share this link with friends. When they use it to contribute to campaigns, you'll earn rewards!
              </p>
            </div>

            {/* Recent Referrals */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Referrals</h3>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No referrals yet</h3>
                <p className="text-gray-600">Share your referral link to start earning rewards!</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* How It Works */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Share Your Link</h4>
                    <p className="text-sm text-gray-600">Copy and share your unique referral link with friends and community.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">They Contribute</h4>
                    <p className="text-sm text-gray-600">When someone uses your link to contribute to campaigns.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">You Earn Rewards</h4>
                    <p className="text-sm text-gray-600">Earn tokens, NFTs, and platform rewards for successful referrals.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rewards Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rewards</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">5% of contribution</span>
                  <span className="text-sm font-medium text-green-600">Token reward</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">10+ referrals</span>
                  <span className="text-sm font-medium text-purple-600">Exclusive NFT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">50+ referrals</span>
                  <span className="text-sm font-medium text-orange-600">Governance rights</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referrals;