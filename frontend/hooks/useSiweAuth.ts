"use client";
import { useCallback, useMemo, useState } from "react";
import { useAccount, useSignMessage, useChainId } from "wagmi";

type Session = {
  authenticated: boolean;
  session?: {
    address: `0x${string}`;
    chainId: number;
    issuedAt: string;
    expirationTime?: string;
  };
};

export function useSiweAuth() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const getNonce = useCallback(async () => {
    const res = await fetch("/api/siwe/nonce", { credentials: "include" });
    if (!res.ok) throw new Error("failed to get nonce");
    return await res.text();
  }, []);

  const buildMessage = useCallback(
    async (nonce: string) => {
      const domain = window.location.host;
      const origin = window.location.origin;
      return `${domain} wants you to sign in with your Ethereum account:\n${address}\n\nSign in to Unikyc.\n\nURI: ${origin}\nVersion: 1\nChain ID: ${chainId}\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}`;
    },
    [address, chainId],
  );

  const signIn = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (!isConnected || !address) throw new Error("wallet not connected");
      const nonce = await getNonce();
      const message = await buildMessage(nonce);
      const signature = await signMessageAsync({ message });
      const res = await fetch("/api/siwe/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message, signature }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "verify failed");
      setSession({ authenticated: true, session: data.session });
      return data.session as Session["session"];
    } catch (e: any) {
      setError(e?.message || "sign in failed");
      throw e;
    } finally {
      setLoading(false);
    }
  }, [address, buildMessage, getNonce, isConnected, signMessageAsync]);

  const fetchSession = useCallback(async () => {
    const res = await fetch("/api/siwe/session", { credentials: "include" });
    const data = (await res.json()) as Session;
    setSession(data);
    return data;
  }, []);

  return useMemo(
    () => ({ loading, error, session, signIn, fetchSession }),
    [loading, error, session, signIn, fetchSession],
  );
}


