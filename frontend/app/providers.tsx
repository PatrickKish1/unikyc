/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useMemo, type ReactNode } from "react";
import { baseSepolia, base } from "wagmi/chains";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransactionProvider } from 'ethereum-identity-kit';

// Create wagmi config
// base sepolia
const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
});

// base
// const config = createConfig({
//   chains: [base],
//   transports: {
//     [base.id]: http(),
//   },
// });

export function Providers(props: { children: ReactNode }) {
  // Create QueryClient inside component to avoid hydration issues
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
      },
    },
  }), []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TransactionProvider>
          <MiniKitProvider
            apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
            chain={baseSepolia}
            // chain={base}
            config={{
              appearance: {
                mode: "auto",
                theme: "base",
                name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
                logo: process.env.NEXT_PUBLIC_ICON_URL,
              },
            }}
          >
            {props.children}
          </MiniKitProvider>
        </TransactionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
