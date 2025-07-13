import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Contribution {
  id: string;
  contributor_id: string;
  campaign_id: string;
  amount: number;
  transaction_hash: string;
  referral_code: string | null;
  created_at: string;
  campaign?: {
    title: string;
    creator_id: string;
  };
  contributor?: {
    username: string | null;
    wallet_address: string | null;
  };
}

export const useContributions = () => {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setContributions([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchUserContributions = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('contributions')
          .select(`
            *,
            campaign:campaigns!contributions_campaign_id_fkey(title, creator_id),
            contributor:profiles!contributions_contributor_id_fkey(username, wallet_address)
          `)
          .eq('contributor_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10); // Limit initial load for faster response

        if (!mounted) return;

        if (error) throw error;
        setContributions(data || []);
      } catch (err) {
        if (!mounted) return;
        console.error('Error fetching contributions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch contributions');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchUserContributions();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('contributions')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'contributions' },
        (payload) => {
          if (!mounted) return;

          if (payload.eventType === 'INSERT') {
            const newContribution = payload.new as Contribution;
            if (newContribution.contributor_id === user.id) {
              setContributions(prev => [newContribution, ...prev]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchAllContributions = async () => {
    try {
      if (!user) return;

      setLoading(true);
      const { data, error } = await supabase
        .from('contributions')
        .select(`
          *,
          campaign:campaigns!contributions_campaign_id_fkey(title, creator_id),
          contributor:profiles!contributions_contributor_id_fkey(username, wallet_address)
        `)
        .eq('contributor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContributions(data || []);
    } catch (err) {
      console.error('Error fetching all contributions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch contributions');
    } finally {
      setLoading(false);
    }
  };

  const createContribution = async (contributionData: {
    campaign_id: string;
    amount: number;
    transaction_hash: string;
    referral_code?: string;
  }) => {
    try {
      if (!user) throw new Error('User must be logged in');

      const { data, error } = await supabase
        .from('contributions')
        .insert({
          ...contributionData,
          contributor_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update user's total donated amount
      const { error: profileError } = await supabase.rpc('increment_total_donated', {
        user_id: user.id,
        amount: contributionData.amount
      });

      if (profileError) console.error('Error updating total donated:', profileError);

      return data;
    } catch (err) {
      console.error('Error creating contribution:', err);
      throw err;
    }
  };

  const getCampaignContributions = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('contributions')
        .select(`
          *,
          contributor:profiles!contributions_contributor_id_fkey(username, wallet_address)
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching campaign contributions:', err);
      return [];
    }
  };

  const getTotalContributed = async (userId?: string) => {
    try {
      const targetUserId = userId || user?.id;
      if (!targetUserId) return 0;

      const { data, error } = await supabase
        .from('contributions')
        .select('amount')
        .eq('contributor_id', targetUserId);

      if (error) throw error;
      
      return data?.reduce((total, contribution) => total + contribution.amount, 0) || 0;
    } catch (err) {
      console.error('Error calculating total contributed:', err);
      return 0;
    }
  };

  return {
    contributions,
    loading,
    error,
    createContribution,
    getCampaignContributions,
    getTotalContributed,
    fetchAllContributions,
  };
};