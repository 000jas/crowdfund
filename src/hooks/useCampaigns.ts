import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Campaign {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  funding_goal: number;
  current_funding: number;
  deadline: string;
  category: string;
  image_ipfs_hash: string | null;
  media_ipfs_hashes: string[] | null;
  is_active: boolean;
  contract_address: string | null;
  created_at: string;
  updated_at: string;
  creator?: {
    username: string | null;
    wallet_address: string | null;
  };
}

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('campaigns')
          .select(`
            *,
            creator:profiles!campaigns_creator_id_fkey(username, wallet_address)
          `)
          .order('created_at', { ascending: false })
          .limit(20); // Limit initial load for faster response

        if (!mounted) return;

        if (error) throw error;
        setCampaigns(data || []);
      } catch (err) {
        if (!mounted) return;
        console.error('Error fetching campaigns:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Start fetching immediately
    fetchCampaigns();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('campaigns')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'campaigns' },
        (payload) => {
          if (!mounted) return;

          if (payload.eventType === 'INSERT') {
            setCampaigns(prev => [payload.new as Campaign, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setCampaigns(prev => 
              prev.map(campaign => 
                campaign.id === payload.new.id ? payload.new as Campaign : campaign
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setCampaigns(prev => 
              prev.filter(campaign => campaign.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchAllCampaigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          creator:profiles!campaigns_creator_id_fkey(username, wallet_address)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error('Error fetching all campaigns:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (campaignData: {
    title: string;
    description: string;
    funding_goal: number;
    deadline: string;
    category: string;
    image_ipfs_hash?: string;
    media_ipfs_hashes?: string[];
  }) => {
    try {
      if (!user) throw new Error('User must be logged in');

      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          ...campaignData,
          creator_id: user.id,
          current_funding: 0,
          is_active: true, // Ensure campaign is active
          media_ipfs_hashes: campaignData.media_ipfs_hashes || [],
        })
        .select()
        .single();

      if (error) throw error;
      // Fallback: refetch campaigns after creation
      await fetchAllCampaigns();
      return data;
    } catch (err) {
      console.error('Error creating campaign:', err);
      throw err;
    }
  };

  const updateCampaignFunding = async (campaignId: string, amount: number) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .update({ 
          current_funding: amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error updating campaign funding:', err);
      throw err;
    }
  };

  const getCampaignById = async (id: string): Promise<Campaign | null> => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          creator:profiles!campaigns_creator_id_fkey(username, wallet_address)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching campaign:', err);
      return null;
    }
  };

  const getUserCampaigns = async (userId?: string) => {
    try {
      const targetUserId = userId || user?.id;
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('creator_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching user campaigns:', err);
      return [];
    }
  };

  return {
    campaigns,
    loading,
    error,
    createCampaign,
    updateCampaignFunding,
    getCampaignById,
    getUserCampaigns,
    refetch: fetchAllCampaigns,
  };
};