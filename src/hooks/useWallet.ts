import { useState, useEffect } from 'react';
import { web3Service } from '../lib/web3';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
}

interface WindowWithEthereum extends Window {
  ethereum?: EthereumProvider;
}

export interface WalletDetails {
  address: string;
  balance: string;
  network: string;
  chainId: string;
  isCorrectNetwork: boolean;
  isConnected: boolean;
}

export const useWallet = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState<string>('0');
  const [network, setNetwork] = useState<string>('');
  const [chainId, setChainId] = useState<string>('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const { connectWallet: updateProfileWallet, profile } = useAuth();

  useEffect(() => {
    // Check if wallet was previously connected
    if (profile?.wallet_address) {
      setWalletAddress(profile.wallet_address);
      updateBalance(profile.wallet_address);
    }

    // Listen for account changes
    const ethereum = (window as WindowWithEthereum).ethereum;
    if (ethereum) {
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (ethereum) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [profile]);

  const fetchNetworkDetails = async () => {
    try {
      const ethereum = (window as WindowWithEthereum).ethereum;
      if (ethereum) {
        const currentChainId = await ethereum.request({ method: 'eth_chainId' });
        const currentNetwork = currentChainId === '0x1F92' ? 'Shardeum Sphinx' : 'Unknown Network';
        const isCorrect = currentChainId === '0x1F92';
        
        setChainId(currentChainId);
        setNetwork(currentNetwork);
        setIsCorrectNetwork(isCorrect);
      }
    } catch (error) {
      console.error('Error fetching network details:', error);
    }
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected wallet
      setWalletAddress(null);
      setBalance('0');
      setNetwork('');
      setChainId('');
      setIsCorrectNetwork(false);
      toast.info('Wallet disconnected');
    } else {
      // User switched accounts
      const newAddress = accounts[0];
      setWalletAddress(newAddress);
      await updateBalance(newAddress);
      await updateProfileWallet(newAddress);
      await fetchNetworkDetails();
      toast.success('Wallet account changed');
    }
  };

  const handleChainChanged = async () => {
    // Update network details when chain changes
    await fetchNetworkDetails();
    toast.info('Network changed');
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      
      // Check if MetaMask is available
      const ethereum = (window as WindowWithEthereum).ethereum;
      if (!ethereum) {
        toast.error('MetaMask is not installed. Please install MetaMask and try again.');
        return;
      }

      const address = await web3Service.connectWallet();
      if (address) {
        setWalletAddress(address);
        await updateBalance(address);
        await updateProfileWallet(address);
        await fetchNetworkDetails();
        toast.success('Wallet connected successfully!');
      }
    } catch (error: unknown) {
      console.error('Error connecting wallet:', error);
      
      // Show specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('MetaMask is not installed')) {
        toast.error('MetaMask is not installed. Please install MetaMask and try again.');
      } else if (errorMessage.includes('User rejected')) {
        toast.error('Connection was rejected. Please try again and approve the request.');
      } else if (errorMessage.includes('No accounts found')) {
        toast.error('No wallet accounts found. Please unlock MetaMask and try again.');
      } else if (errorMessage.includes('Shardeum network')) {
        toast.error('Please switch to Shardeum network in MetaMask and try again.');
      } else {
        toast.error(errorMessage || 'Failed to connect wallet. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const updateBalance = async (address: string) => {
    try {
      const balance = await web3Service.getBalance(address);
      setBalance(balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('0');
    }
  };

  const sendTransaction = async (to: string, amount: string) => {
    try {
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      const txHash = await web3Service.sendTransaction(to, amount);
      await updateBalance(walletAddress);
      toast.success('Transaction sent successfully!');
      return txHash;
    } catch (error: unknown) {
      console.error('Error sending transaction:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('User rejected')) {
        toast.error('Transaction was rejected. Please try again.');
      } else if (errorMessage.includes('insufficient funds')) {
        toast.error('Insufficient funds for this transaction.');
      } else {
        toast.error(errorMessage || 'Failed to send transaction.');
      }
      throw error;
    }
  };

  const disconnectWallet = async () => {
    try {
      console.log('Disconnecting wallet...');
      
      // Clear local wallet state
      setWalletAddress(null);
      setBalance('0');
      setNetwork('');
      setChainId('');
      setIsCorrectNetwork(false);
      
      // Update profile to remove wallet address
      await updateProfileWallet('');
      
      // Remove event listeners
      const ethereum = (window as WindowWithEthereum).ethereum;
      if (ethereum) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
      
      toast.success('Wallet disconnected successfully!');
      console.log('Wallet disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet.');
    }
  };

  const switchToShardeum = async () => {
    try {
      await web3Service.switchToShardeum();
      await fetchNetworkDetails();
      toast.success('Switched to Shardeum network!');
    } catch (error: unknown) {
      console.error('Error switching network:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch network.';
      toast.error(errorMessage);
    }
  };

  const isConnected = !!walletAddress;

  const walletDetails: WalletDetails = {
    address: walletAddress || '',
    balance,
    network,
    chainId,
    isCorrectNetwork,
    isConnected
  };

  return {
    walletAddress,
    balance,
    network,
    chainId,
    isCorrectNetwork,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    sendTransaction,
    updateBalance,
    switchToShardeum,
    walletDetails
  };
};