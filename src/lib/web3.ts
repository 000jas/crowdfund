import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';

// Shardeum network configuration
export const SHARDEUM_NETWORK = {
  chainId: '0x1F92', // 8082 in hex
  chainName: 'Shardeum Sphinx',
  nativeCurrency: {
    name: 'Shardeum',
    symbol: 'SHM',
    decimals: 18,
  },
  rpcUrls: [import.meta.env.VITE_SHARDEUM_RPC_URL || 'https://sphinx.shardeum.org/'],
  blockExplorerUrls: ['https://explorer-sphinx.shardeum.org/'],
};

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
}

interface WindowWithEthereum extends Window {
  ethereum?: EthereumProvider;
}

export class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  async connectWallet(): Promise<string | null> {
    try {
      // Check if MetaMask is installed
      const ethereum = await detectEthereumProvider({ mustBeMetaMask: true });
      
      if (!ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask and try again.');
      }

      // Check if user is already connected
      const accounts = await (ethereum as EthereumProvider).request({
        method: 'eth_accounts',
      }) as string[];

      if (accounts.length === 0) {
        // Request account access
        const requestedAccounts = await (ethereum as EthereumProvider).request({
          method: 'eth_requestAccounts',
        }) as string[];

        if (requestedAccounts.length === 0) {
          throw new Error('No accounts found. Please connect your wallet in MetaMask.');
        }
      }

      // Initialize provider and signer
      this.provider = new ethers.BrowserProvider(ethereum as unknown as ethers.Eip1193Provider);
      this.signer = await this.provider.getSigner();

      // Get the current account
      const currentAccount = await this.signer.getAddress();

      // Switch to Shardeum network
      await this.switchToShardeum();

      return currentAccount;
    } catch (error: unknown) {
      console.error('Error connecting wallet:', error);
      
      // Provide more specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('User rejected')) {
        throw new Error('User rejected the connection request.');
      } else if (errorMessage.includes('Please check MetaMask')) {
        throw new Error('Please check MetaMask and approve the connection request.');
      } else if (errorMessage.includes('MetaMask')) {
        throw new Error('MetaMask is not installed. Please install MetaMask and try again.');
      } else {
        throw new Error(errorMessage || 'Failed to connect wallet. Please try again.');
      }
    }
  }

  async switchToShardeum(): Promise<void> {
    try {
      const ethereum = (window as WindowWithEthereum).ethereum;
      
      if (!ethereum) {
        throw new Error('MetaMask not available');
      }

      // Get current chain ID
      const chainId = await ethereum.request({ method: 'eth_chainId' }) as string;
      
      // If already on Shardeum, no need to switch
      if (chainId === SHARDEUM_NETWORK.chainId) {
        return;
      }

      // Try to switch to Shardeum network
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: SHARDEUM_NETWORK.chainId }],
        });
      } catch (switchError: unknown) {
        // If network doesn't exist, add it
        const switchErrorMessage = switchError instanceof Error ? switchError.message : '';
        if (switchErrorMessage.includes('4902')) {
          try {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [SHARDEUM_NETWORK],
            });
          } catch (addError: unknown) {
            const addErrorMessage = addError instanceof Error ? addError.message : '';
            if (addErrorMessage.includes('4001')) {
              throw new Error('User rejected adding Shardeum network to MetaMask.');
            } else {
              throw new Error('Failed to add Shardeum network to MetaMask. Please add it manually.');
            }
          }
        } else if (switchErrorMessage.includes('4001')) {
          throw new Error('User rejected switching to Shardeum network.');
        } else {
          throw new Error('Failed to switch to Shardeum network. Please switch manually in MetaMask.');
        }
      }
    } catch (error: unknown) {
      console.error('Error switching to Shardeum:', error);
      throw error;
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      if (!this.provider) {
        // Try to reconnect if provider is not available
        await this.connectWallet();
      }
      
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }
      
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  async sendTransaction(to: string, amount: string): Promise<string> {
    try {
      if (!this.signer) {
        // Try to reconnect if signer is not available
        await this.connectWallet();
      }

      if (!this.signer) {
        throw new Error('Signer not initialized');
      }

      const tx = await this.signer.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });

      await tx.wait();
      return tx.hash;
    } catch (error: unknown) {
      console.error('Error sending transaction:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('User rejected')) {
        throw new Error('User rejected the transaction.');
      } else if (errorMessage.includes('insufficient funds')) {
        throw new Error('Insufficient funds for transaction.');
      } else {
        throw new Error(errorMessage || 'Failed to send transaction.');
      }
    }
  }

  async deployContract(abi: unknown[], bytecode: string, ...args: unknown[]): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized');

    const factory = new ethers.ContractFactory(abi as ethers.InterfaceAbi, bytecode, this.signer);
    const contract = await factory.deploy(...args);
    await contract.waitForDeployment();

    return await contract.getAddress();
  }

  async callContract(address: string, abi: unknown[], method: string, ...args: unknown[]): Promise<unknown> {
    if (!this.provider) throw new Error('Provider not initialized');

    const contract = new ethers.Contract(address, abi as ethers.InterfaceAbi, this.provider);
    return await contract[method](...args);
  }

  async sendContractTransaction(address: string, abi: unknown[], method: string, ...args: unknown[]): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized');

    const contract = new ethers.Contract(address, abi as ethers.InterfaceAbi, this.signer);
    const tx = await contract[method](...args);
    await tx.wait();

    return tx.hash;
  }

  getSigner(): ethers.JsonRpcSigner | null {
    return this.signer;
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }

  // Check if wallet is connected
  async isWalletConnected(): Promise<boolean> {
    try {
      const ethereum = (window as WindowWithEthereum).ethereum;
      if (!ethereum) return false;
      
      const accounts = await ethereum.request({ method: 'eth_accounts' }) as string[];
      return accounts.length > 0;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  }
}

export const web3Service = new Web3Service();