import { useState, useEffect, useCallback } from "react";
import { formatEther, parseEther, isAddress } from "ethers";
import { useWallet } from "~/context/WalletContext";
import { getTokenReadOnly, getTokenWithSigner } from "~/lib/contracts";

// Known holders — deployer holds the full supply at launch.
// Add addresses here as shares are distributed.
// (eth_getLogs over full range requires a paid RPC plan)
const KNOWN_HOLDERS = [
  "0xc1827E20910a27549179D81620E284993ae53B5E", // deployer
  "0xD6f1bc710f8a9272890715A70820Cf4198fE5c95", // my other account
];

export default function DashboardPage() {
  const { address, signer } = useWallet();
  const [totalSupply, setTotalSupply] = useState("");
  const [myBalance, setMyBalance] = useState("");
  const [myPct, setMyPct] = useState("");
  const [ownerAddr, setOwnerAddr] = useState("");
  const [holders, setHolders] = useState<{ address: string; balance: string; pct: string }[]>([]);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isDistributing, setIsDistributing] = useState(false);
  const [distError, setDistError] = useState<string | null>(null);
  const [distSuccess, setDistSuccess] = useState<string | null>(null);

  const isOwner = address && ownerAddr && address.toLowerCase() === ownerAddr.toLowerCase();

  const fetchData = useCallback(async () => {
    const token = getTokenReadOnly();
    const [supply, owner] = await Promise.all([token.totalSupply(), token.owner()]);
    setTotalSupply(formatEther(supply as bigint));
    setOwnerAddr(owner as string);

    if (address) {
      const [bal, pct] = await Promise.all([
        token.balanceOf(address),
        token.ownershipPercentage(address),
      ]);
      setMyBalance(formatEther(bal as bigint));
      setMyPct((pct as bigint).toString());
    }

    const holderData = await Promise.all(
      KNOWN_HOLDERS.map(async (addr) => {
        const [bal, pct] = await Promise.all([
          token.balanceOf(addr),
          token.ownershipPercentage(addr),
        ]);
        return {
          address: addr,
          balance: parseFloat(formatEther(bal as bigint)).toLocaleString(),
          pct: (pct as bigint).toString(),
        };
      }),
    );
    setHolders(holderData.filter((h) => parseFloat(h.balance.replace(/,/g, "")) > 0));
  }, [address]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDistribute(e: React.FormEvent) {
    e.preventDefault();
    if (!signer) return;
    setDistError(null);
    setDistSuccess(null);
    if (!isAddress(recipient)) {
      setDistError("Invalid wallet address.");
      return;
    }
    const wei = parseEther(amount);
    if (wei <= 0n) {
      setDistError("Amount must be greater than zero.");
      return;
    }
    setIsDistributing(true);
    try {
      const token = getTokenWithSigner(signer);
      const tx = await token.distributeShares(recipient, wei);
      await tx.wait();
      setDistSuccess(`Sent ${amount} ALUT to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`);
      setRecipient("");
      setAmount("");
      await fetchData();
    } catch (err: unknown) {
      setDistError(
        (err as { reason?: string })?.reason ??
          (err instanceof Error ? err.message : "Transaction failed"),
      );
    } finally {
      setIsDistributing(false);
    }
  }

  if (!address) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-gray-500">Connect your wallet to view the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Token Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total Supply",
            value: `${parseFloat(totalSupply || "0").toLocaleString()} ALUT`,
          },
          {
            label: "Your Balance",
            value: `${parseFloat(myBalance || "0").toLocaleString()} ALUT`,
          },
          { label: "Your Ownership", value: `${myPct || "0"}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Holders table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Ownership Breakdown</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-gray-500 font-medium">Address</th>
              <th className="px-6 py-3 text-right text-gray-500 font-medium">Balance</th>
              <th className="px-6 py-3 text-right text-gray-500 font-medium">Ownership</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {holders.map((h) => (
              <tr key={h.address}>
                <td className="px-6 py-3 font-mono text-gray-700">
                  {h.address.slice(0, 6)}...{h.address.slice(-4)}
                </td>
                <td className="px-6 py-3 text-right text-gray-700">{h.balance} ALUT</td>
                <td className="px-6 py-3 text-right text-gray-700">{h.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Distribute (owner only) */}
      {isOwner && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Distribute Shares</h2>
          <form onSubmit={handleDistribute} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (ALUT)</label>
              <input
                type="number"
                placeholder="e.g. 100000"
                value={amount}
                min="1"
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isDistributing}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isDistributing ? "Waiting for MetaMask..." : "Distribute Shares"}
            </button>
          </form>
          {distSuccess && <p className="mt-3 text-green-700 text-sm">{distSuccess}</p>}
          {distError && <p className="mt-3 text-red-700 text-sm">{distError}</p>}
        </div>
      )}
    </div>
  );
}
