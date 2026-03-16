import { useState, useRef } from "react";
import { useWallet } from "~/context/WalletContext";
import { hashFile } from "~/lib/hash";
import { getRegistryWithSigner } from "~/lib/contracts";

export default function RegisterPage() {
  const { address, signer } = useWallet();
  const [preview, setPreview] = useState<string | null>(null);
  const [hash, setHash] = useState("");
  const [name, setName] = useState("");
  const [fileType, setFileType] = useState("image/png");
  const [isRegistering, setIsRegistering] = useState(false);
  const [result, setResult] = useState<{
    tokenId: string;
    txHash: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setHash(await hashFile(file));
    setFileType(file.type || "image/png");
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!signer) return;
    setIsRegistering(true);
    setError(null);
    setResult(null);
    try {
      const registry = getRegistryWithSigner(signer);
      const tx = await registry.registerAsset(name, fileType, hash);
      const receipt = await tx.wait();
      const event = receipt.logs
        .map((log: unknown) => {
          try {
            return registry.interface.parseLog(
              log as { topics: string[]; data: string },
            );
          } catch {
            return null;
          }
        })
        .find(
          (e: unknown) =>
            (e as { name?: string } | null)?.name === "AssetRegistered",
        );
      setResult({
        tokenId: event?.args?.tokenId?.toString() ?? "1",
        txHash: receipt.hash,
      });
    } catch (err: unknown) {
      const msg =
        (err as { reason?: string })?.reason ??
        (err instanceof Error ? err.message : "Transaction failed");
      setError(
        msg.includes("already registered")
          ? "This logo is already registered on the blockchain."
          : msg,
      );
    } finally {
      setIsRegistering(false);
    }
  }

  if (!address) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-gray-500">
          Connect your wallet to register an asset.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Register Asset</h1>
      <p className="text-gray-500 mb-6">
        Register a logo on the blockchain as an NFT.
      </p>

      {/* Step 1 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="font-semibold text-gray-900 mb-3">
          Step 1 — Upload File
        </h2>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400"
        >
          <p className="text-gray-500">Click to select an image</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </div>
        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="max-h-40 mt-4 rounded mx-auto bg-gray-300 overflow-clip"
          />
        )}
        {hash && (
          <div className="mt-3 bg-gray-50 rounded p-3">
            <p className="text-xs text-gray-500 font-mono break-all">
              SHA-256: {hash}
            </p>
          </div>
        )}
      </div>

      {/* Step 2 */}
      <form
        onSubmit={handleRegister}
        className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
      >
        <h2 className="font-semibold text-gray-900">
          Step 2 — Register on Blockchain
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Asset Name
          </label>
          <input
            type="text"
            placeholder="e.g. ALU Official Logo 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            File Type
          </label>
          <input
            type="text"
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content Hash (bytes32)
          </label>
          <input
            type="text"
            value={hash}
            readOnly
            placeholder="Upload a file above to generate hash"
            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm font-mono bg-gray-50 text-gray-500"
          />
        </div>
        <button
          type="submit"
          disabled={!hash || !name || isRegistering}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isRegistering ? "Waiting for MetaMask..." : "Register Asset"}
        </button>
      </form>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">
            Registered — Token #{result.tokenId}
          </p>
          <p className="text-sm text-green-700 font-mono mt-1 break-all">
            Tx: {result.txHash}
          </p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
