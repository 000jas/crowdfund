import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useCampaigns, Campaign } from '../hooks/useCampaigns';
import { useAuth } from '../hooks/useAuth';
import { ipfsService } from '../lib/ipfs';
import { Target, Image, FileText } from 'lucide-react';

const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [donationAmount, setDonationAmount] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { getCampaignById } = useCampaigns();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const campaignData = await getCampaignById(id);
        setCampaign(campaignData);
      } catch (error) {
        console.error('Error fetching campaign:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id, getCampaignById]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return <Navigate to="/campaigns" replace />;
  }

  const progress = (campaign.current_funding / campaign.funding_goal) * 100;
  const daysLeft = Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const handleDonate = () => {
    if (donationAmount) {
      alert(`Donating ${donationAmount} SHM to ${campaign.title}`);
      setDonationAmount('');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'milestones', label: 'Milestones' },
    { id: 'updates', label: 'Updates' },
    { id: 'media', label: 'Media Gallery' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Campaign Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="relative h-64 md:h-96">
            <img 
              src={campaign.image_ipfs_hash ? ipfsService.getFileUrl(campaign.image_ipfs_hash) : 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800'} 
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-purple-700 text-sm font-semibold rounded-full">
                  {campaign.category}
                </span>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  daysLeft > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{campaign.title}</h1>
              <p className="text-white/90 text-lg line-clamp-2">{campaign.description}</p>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{campaign.current_funding.toFixed(2)} SHM</div>
                <div className="text-sm text-gray-600">Raised</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{campaign.funding_goal.toFixed(2)} SHM</div>
                <div className="text-sm text-gray-600">Goal</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{progress.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Funded</div>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
              <div 
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>

            {user && daysLeft > 0 && (
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  placeholder="Amount in SHM"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={handleDonate}
                  disabled={!donationAmount}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Donate
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Campaign Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">About This Campaign</h3>
                  <p className="text-gray-600 leading-relaxed">{campaign.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Campaign Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Creator:</span>
                        <span className="font-medium">{campaign.creator?.username || 'Anonymous'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">{campaign.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">{new Date(campaign.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Deadline:</span>
                        <span className="font-medium">{new Date(campaign.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Funding Progress</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Funding:</span>
                        <span className="font-medium">{campaign.current_funding.toFixed(2)} SHM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Funding Goal:</span>
                        <span className="font-medium">{campaign.funding_goal.toFixed(2)} SHM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Progress:</span>
                        <span className="font-medium">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time Left:</span>
                        <span className="font-medium">{daysLeft > 0 ? `${daysLeft} days` : 'Ended'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'milestones' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No milestones yet</h3>
                <p className="text-gray-600">Milestones will be added as the campaign progresses.</p>
              </div>
            )}

            {activeTab === 'updates' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No updates yet</h3>
                <p className="text-gray-600">Campaign updates will appear here.</p>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Image className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No media yet</h3>
                <p className="text-gray-600">Media files will be added as the campaign progresses.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail;