import { create } from 'ipfs-http-client';

const IPFS_API_URL = import.meta.env.VITE_IPFS_API_URL || 'https://ipfs.infura.io:5001';
const IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';

// Create IPFS client
const ipfs = create({
  url: IPFS_API_URL,
});

export class IPFSService {
  async uploadFile(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${IPFS_API_URL}/api/v0/add`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file to IPFS');
      }

      const result = await response.json();
      return result.Hash;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  }

  async uploadJSON(data: Record<string, unknown>): Promise<string> {
    try {
      const result = await ipfs.add(JSON.stringify(data));
      return result.cid.toString();
    } catch (error) {
      console.error('Error uploading JSON to IPFS:', error);
      throw new Error('Failed to upload data to IPFS');
    }
  }

  async uploadMultipleFiles(files: File[]): Promise<string[]> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('file', file);
      });

      const response = await fetch(`${IPFS_API_URL}/api/v0/add`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload files to IPFS');
      }

      const result = await response.json();
      return Array.isArray(result) ? result.map((item: { Hash: string }) => item.Hash) : [result.Hash];
    } catch (error) {
      console.error('Error uploading multiple files to IPFS:', error);
      throw new Error('Failed to upload files to IPFS');
    }
  }

  getFileUrl(hash: string): string {
    return `${IPFS_GATEWAY}${hash}`;
  }

  async getFileContent(hash: string): Promise<unknown> {
    try {
      const response = await fetch(this.getFileUrl(hash));
      return await response.json();
    } catch (error) {
      console.error('Error fetching from IPFS:', error);
      throw new Error('Failed to fetch content from IPFS');
    }
  }
}

export const ipfsService = new IPFSService();