/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from "@storacha/client";

let clientPromise: Promise<any> | null = null;
let currentSpace: any = null;

export async function getStorachaClient() {
  if (!clientPromise) {
    clientPromise = create();
  }
  return clientPromise;
}

export async function initializeStorachaSpace(email?: string) {
  const client = await getStorachaClient();
  
  try {
    // Try to get current space first
    currentSpace = await client.currentSpace();
    return currentSpace;
  } catch (error) {
    // No current space exists
    if (email) {
      // Login with email if provided
      const account = await client.login(email);
      
      // Wait for payment plan (required for space provisioning)
      await account.plan.wait();
      
      // Create a new space
      const space = await client.createSpace('unikyc-space', { account });
      await client.setCurrentSpace(space.did());
      currentSpace = space;
      return space;
    } else {
      // Create space without account (less secure)
      const space = await client.createSpace('unikyc-space');
      await client.setCurrentSpace(space.did());
      currentSpace = space;
      return space;
    }
  }
}

export async function uploadFile(blob: Blob, email?: string): Promise<string> {
  try {
    const client = await getStorachaClient();
    
    // Ensure we have a space
    if (!currentSpace) {
      await initializeStorachaSpace(email);
    }
    
    const cid = await client.uploadFile(blob);
    return cid.toString();
  } catch (error) {
    console.error('Failed to upload file to Storacha:', error);
    throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function uploadDirectory(files: File[], email?: string): Promise<string> {
  try {
    const client = await getStorachaClient();
    
    // Ensure we have a space
    if (!currentSpace) {
      await initializeStorachaSpace(email);
    }
    
    const cid = await client.uploadDirectory(files);
    return cid.toString();
  } catch (error) {
    console.error('Failed to upload directory to Storacha:', error);
    throw new Error(`Directory upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to get IPFS gateway URL
export function getStorachaGatewayUrl(cid: string): string {
  return `https://${cid}.ipfs.storacha.link/`;
}

// Helper function to check if client is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const client = await getStorachaClient();
    await client.currentSpace();
    return true;
  } catch {
    return false;
  }
}


