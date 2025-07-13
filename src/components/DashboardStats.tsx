import React from 'react';
import { TrendingUp, Users, Target, Award } from 'lucide-react';
import { User } from '../types';

interface DashboardStatsProps {
  user: User | null;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ user }) => {
  const stats = [
    {
      label: 'Total Contributed',
      value: user ? `$${user.totalDonated.toLocaleString()}` : '$0',
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Campaigns Backed',
      value: '12',
      icon: Target,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Referral Earnings',
      value: user ? `$${user.referralEarnings.toLocaleString()}` : '$0',
      icon: Users,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'NFTs Earned',
      value: user ? user.nftsEarned.length.toString() : '0',
      icon: Award,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-6 h-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;