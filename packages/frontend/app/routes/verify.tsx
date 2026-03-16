import { useState, useRef } from "react";
import { hashFile, isValidBytes32 } from "~/lib/hash";
import { getRegistryReadOnly } from "~/lib/contracts";

type Result =
  | { status: "success"; name: string; registrant: string; date: string }
  | { status: "failure" }
  | null;

export default function VerifyPage() {
  const [tab, setTab]             = useState<"file" | "hash">("file");
  const [preview, setPreview]     = useState<string | null>(null);
  const [computedHash, setComputedHash] = useState("");
  const [pastedHash, setPastedHash]     = useState("");
  const [isVerifying, setIsVerifying]   = useState(false);
  const [result, setResult]       = useState<Result>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setComputedHash(await hashFile(file));
  }

  async function verify(hash: string) {
    if (!isValidBytes32(hash)) return;
    setIsVerifying(true);
    setResult(null);
    try {
      const registry = getRegistryReadOnly();
      const [valid] = await registry.verifyLogoIntegrity(1, hash);
      if (valid) {
        const asset = await registry.getAsset(1);
        setResult({
          status: "success",
          name: asset.name,
          registrant: asset.registrant,
          date: new Date(Number(asset.timestamp) * 1000).toLocaleDateString(),
        });
      } else {
        setResult({ status: "failure" });
      }
    } catch {
      setResult({ status: "failure" });
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Logo Verification</h1>
      <p className="text-gray-500 mb-6">Check whether a logo is authentic. No wallet required.</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(["file", "hash"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setResult(null); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t === "file" ? "Upload File" : "Paste Hash"}
          </button>
        ))}
      </div>

      {tab === "file" && (
        <div className="space-y-4">
          <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center cursor-pointer hover:border-blue-400">
            <p className="text-gray-500">Click or drag an image to verify</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          {preview && <img src={preview} alt="Preview" className="max-h-40 rounded-lg mx-auto" />}
          {computedHash && (
            <div className="bg-gray-50 rounded p-3">
              <p className="text-xs text-gray-500 font-mono break-all">SHA-256: {computedHash}</p>
            </div>
          )}
          <button onClick={() => verify(computedHash)} disabled={!computedHash || isVerifying}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {isVerifying ? "Verifying..." : "Verify Logo"}
          </button>
        </div>
      )}

      {tab === "hash" && (
        <div className="space-y-4">
          <input type="text" placeholder="0x..." value={pastedHash}
            onChange={(e) => { setPastedHash(e.target.value); setResult(null); }}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          <button onClick={() => verify(pastedHash)} disabled={!isValidBytes32(pastedHash) || isVerifying}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {isVerifying ? "Verifying..." : "Verify Hash"}
          </button>
        </div>
      )}

      {result?.status === "success" && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl text-green-600">✓</span>
            <h2 className="text-lg font-semibold text-green-800">Logo Verified</h2>
          </div>
          <p className="text-green-700 font-medium mb-3">This is the authentic ALU logo.</p>
          <dl className="text-sm text-green-700 space-y-1">
            <div><dt className="inline font-medium">Name: </dt><dd className="inline">{result.name}</dd></div>
            <div><dt className="inline font-medium">Registered: </dt><dd className="inline">{result.date}</dd></div>
            <div><dt className="inline font-medium">By: </dt><dd className="inline font-mono">{result.registrant.slice(0,6)}...{result.registrant.slice(-4)}</dd></div>
          </dl>
        </div>
      )}

      {result?.status === "failure" && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl text-red-600">⚠</span>
            <h2 className="text-lg font-semibold text-red-800">Warning</h2>
          </div>
          <p className="text-red-700 font-medium">
            This logo has been modified or is not the official ALU logo.
          </p>
        </div>
      )}
    </div>
  );
}
