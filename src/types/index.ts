export interface Campaign {
  id: string;
  title: string;
  description: string;
  creator: string;
  target: number;
  raised: number;
  deadline: Date;
  category: string;
  image: string;
  milestones: Milestone[];
  updates: CampaignUpdate[];
  isActive: boolean;
  tags: string[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  isCompleted: boolean;
  votingDeadline: Date;
  votesFor: number;
  votesAgainst: number;
  totalVoters: number;
}

export interface CampaignUpdate {
  id: string;
  title: string;
  content: string;
  media: MediaFile[];
  timestamp: Date;
  author: string;
}

export interface MediaFile {
  id: string;
  type: 'image' | 'video' | 'document';
  url: string;
  ipfsHash: string;
  name: string;
  size: number;
}

export interface Donation {
  id: string;
  campaignId: string;
  campaignTitle: string;
  amount: number;
  timestamp: Date;
  transactionHash: string;
  referralCode?: string;
}

export interface User {
  address: string;
  isVerified: boolean;
  totalDonated: number;
  referralCode: string;
  referralEarnings: number;
  nftsEarned: NFTReward[];
  tokensEarned: number;
}

export interface NFTReward {
  id: string;
  name: string;
  image: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  earnedAt: Date;
}

export interface GovernanceProposal {
  id: string;
  campaignId: string;
  milestoneId: string;
  title: string;
  description: string;
  votingDeadline: Date;
  votesFor: number;
  votesAgainst: number;
  totalVoters: number;
  status: 'active' | 'passed' | 'failed' | 'executed';
}