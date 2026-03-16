import { useWallet } from "~/context/WalletContext";
import { isMetaMaskInstalled, shortenAddress } from "~/lib/wallet";

export function WalletButton() {
  const { address, balance, isConnecting, connect, disconnect } = useWallet();

  if (!isMetaMaskInstalled()) {
    return (
      <a href="https://metamask.io" target="_blank" rel="noopener noreferrer"
        className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
        Install MetaMask
      </a>
    );
  }

  if (address) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">
          {balance ? `${parseFloat(balance).toLocaleString()} ALUT` : "0 ALUT"}
        </span>
        <button onClick={disconnect}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
          {shortenAddress(address)}
        </button>
      </div>
    );
  }

  return (
    <button onClick={connect} disabled={isConnecting}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
