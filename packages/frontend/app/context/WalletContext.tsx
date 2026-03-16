import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { JsonRpcSigner } from "ethers";
import { formatEther } from "ethers";
import { connectWallet, isMetaMaskInstalled } from "~/lib/wallet";
import { getTokenReadOnly } from "~/lib/contracts";

interface WalletState {
  address: string | null;
  signer: JsonRpcSigner | null;
  balance: string | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress]     = useState<string | null>(null);
  const [signer, setSigner]       = useState<JsonRpcSigner | null>(null);
  const [balance, setBalance]     = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const { address, signer } = await connectWallet();
      setAddress(address);
      setSigner(signer);
      const bal = await getTokenReadOnly().balanceOf(address);
      setBalance(formatEther(bal as bigint));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setSigner(null);
    setBalance(null);
  }, []);

  return (
    <WalletContext.Provider value={{ address, signer, balance, isConnecting, error, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
