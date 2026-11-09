import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

/**
 * This file is purely responsible for talking to Azure.
 * It does not care about what kind of files are being uploaded,
 * sizes, validations, or HTTP requests. It just authenticates 
 * and stores a buffer in Blob Storage.
 */
export class AzureStorageClient {
  private static connectionString: string | undefined;

  private static async getContainer() {
    const accountUrl = process.env.AZURE_STORAGE_ACCOUNT_URL;
    const client = accountUrl
      ? new BlobServiceClient(accountUrl, new DefaultAzureCredential())
      : BlobServiceClient.fromConnectionString(await this.getConnectionString());
    return client.getContainerClient(process.env.AZURE_STORAGE_CONTAINER ?? 'uploads');
  }

  public static async getBlob(blobName: string) {
    const container = await this.getContainer();
    return container.getBlobClient(blobName);
  }

  private static async getConnectionString(): Promise<string> {
    // Return cached connection string if we already have it
    if (this.connectionString) return this.connectionString;

    const connString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const keyVaultUri = process.env.AZURE_KEYVAULT_URI;

    if (connString) {
      this.connectionString = connString;
      return connString;
    }

    if (!keyVaultUri) {
      throw new Error('Neither Storage connection string nor Key Vault URI are configured.');
    }

    try {
      const credential = new DefaultAzureCredential();
      const client = new SecretClient(keyVaultUri, credential);
      const secret = await client.getSecret('storage-connection-string');
      
      if (!secret.value) {
          throw new Error("Secret exists but has no value");
      }
      this.connectionString = secret.value;
      return this.connectionString;
    } catch (error) {
      console.error('Failed to fetch Storage connection string from Key Vault:', error);
      throw new Error('Failed to fetch Storage connection string from Key Vault');
    }
  }

  public static isConfigured(): boolean {
    return Boolean(process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_KEYVAULT_URI || process.env.AZURE_STORAGE_ACCOUNT_URL);
  }

  public static async uploadBlob(
    fileBuffer: Buffer,
    blobName: string,
    mimeType: string
  ): Promise<{ url: string }> {
    if (!this.isConfigured()) {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, blobName), fileBuffer);
      return { url: `/api/media/${encodeURIComponent(blobName)}` };
    }

    const containerClient = await this.getContainer();
    
    await containerClient.createIfNotExists();

    const blobClient = containerClient.getBlockBlobClient(blobName);

    await blobClient.uploadData(fileBuffer, {
      blobHTTPHeaders: {
        blobContentType: mimeType,
      },
    });

    const url = `/api/media/${encodeURIComponent(blobName)}`;

    return { url };
  }
}
