#!/usr/bin/env bash
# Inject Mezo chain definitions into @x402/paywall's bundled viem.
#
# WHY: @x402/paywall@2.9.0 bundles viem@2.40.3 which predates Mezo chain
# support. This patch adds Mezo as a fallback on chain lookup call sites.
#
# NOTE: We intentionally skip the wagmi createConfig chain lookup site
# (the one with `find(f=>f.id===i)` followed by `chains:[r]`). Patching
# that site lets wagmi run deeper into its init path, which hits a ??
# operator that MetaMask's SES lockdown can't parse. By leaving wagmi's
# chain lookup unpatched, it gracefully falls back to a default chain.
# The user's wallet must already be on Mezo Testnet (chain 31611) —
# the paywall won't auto-switch chains, but signing + payment work.
#
# WHEN TO REMOVE: Once @x402/paywall ships with x402-foundation/x402
# PR #1920 (merged 2026-04-11), delete this file and the "postinstall"
# script in package.json.
set -euo pipefail

PAYWALL_EVM="node_modules/@x402/paywall/dist/esm/evm/index.js"
[ -f "$PAYWALL_EVM" ] || { echo "patch-paywall: @x402/paywall not found, skipping"; exit 0; }
grep -q "Mezo Testnet" "$PAYWALL_EVM" && { echo "patch-paywall: already patched"; exit 0; }

echo "patch-paywall: injecting Mezo chain definitions..."

node -e '
const fs = require("fs");
const f = process.argv[1];

const MEZO = "[{id:31611,name:\"Mezo Testnet\",nativeCurrency:{decimals:18,name:\"Bitcoin\",symbol:\"BTC\"},rpcUrls:{default:{http:[\"https://rpc.test.mezo.org\"]}},blockExplorers:{default:{name:\"Mezo Testnet Explorer\",url:\"https://explorer.test.mezo.org\"}},testnet:true},{id:31612,name:\"Mezo\",nativeCurrency:{decimals:18,name:\"Bitcoin\",symbol:\"BTC\"},rpcUrls:{default:{http:[\"https://rpc.mezo.org\"]}},blockExplorers:{default:{name:\"Mezo Explorer\",url:\"https://explorer.mezo.org\"}}}]";

let src = fs.readFileSync(f, "utf8");

// Patch chain lookups BUT skip the wagmi config site.
// The wagmi site has: find(f=>f.id===i) immediately followed by );u&&(r=u)
// All other sites use different variable names (z/Y, n/e).
const pattern = /Object\.values\(cx\)\.find\(([a-z])=>\1\.id===([a-zA-Z])\)/g;
let count = 0;
src = src.replace(pattern, (match, arg, id, offset) => {
  // Skip the wagmi config site — identified by find(f=>f.id===i)
  // Patching it triggers SES ?? parsing failure in MetaMask
  if (arg === "f" && id === "i") {
    return match; // leave unpatched
  }
  count++;
  return match + "||" + MEZO + ".find(" + arg + "=>" + arg + ".id===" + id + ")";
});

if (count === 0) {
  console.error("patch-paywall: no patchable chain lookup patterns found");
  process.exit(1);
}

// Fix 2: Convert classic <script> to <script type="module"> ONLY inside the
// HTML template string (line 30). Do NOT touch line 74 (config script injection)
// or other non-template code. MetaMask SES lockdown intercepts classic script
// parsing and chokes on ?? (nullish coalescing). Module scripts bypass SES.
const scriptTag = "<" + "script>";
const moduleTag = "<" + "script type=" + String.fromCharCode(34) + "module" + String.fromCharCode(34) + ">";
const lines = src.split("\n");
let scriptFix = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("<!DOCTYPE html>")) {
    const before = lines[i].split(scriptTag).length - 1;
    lines[i] = lines[i].split(scriptTag).join(moduleTag);
    scriptFix += before;
    break; // only patch the template line
  }
}
src = lines.join("\n");

fs.writeFileSync(f, src);
console.log("patch-paywall: patched " + count + " chain lookup(s), " + scriptFix + " script tag(s) → module");
' "$PAYWALL_EVM"
