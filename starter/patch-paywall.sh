#!/usr/bin/env bash
# Inject Mezo chain definitions into @x402/paywall's bundled viem.
#
# WHY: @x402/paywall@2.9.0 bundles viem@2.40.3 which predates Mezo chain
# support. There are 4 call sites that look up chains by ID, each with
# different minified variable names. This patch adds a Mezo fallback to
# ALL of them via a single regex replacement.
#
# WHEN TO REMOVE: Once @x402/paywall ships with x402-foundation/x402
# PR #1920 (merged 2026-04-11), delete this file and the "postinstall"
# script in package.json.
set -euo pipefail

PAYWALL_EVM="node_modules/@x402/paywall/dist/esm/evm/index.js"
[ -f "$PAYWALL_EVM" ] || { echo "patch-paywall: @x402/paywall not found, skipping"; exit 0; }
grep -q "Mezo Testnet" "$PAYWALL_EVM" && { echo "patch-paywall: already patched"; exit 0; }

echo "patch-paywall: injecting Mezo chain definitions..."

# Use JS object literals (unquoted keys) to match the bundle's minified style.
# JSON.stringify produces "quoted" keys which can conflict with the template
# string context in some browser environments (MetaMask SES lockdown).
node -e '
const fs = require("fs");
const f = process.argv[1];

// Mezo chains as JS object literal (NOT JSON — unquoted keys match bundle style)
const MEZO = "[{id:31611,name:\"Mezo Testnet\",nativeCurrency:{decimals:18,name:\"Bitcoin\",symbol:\"BTC\"},rpcUrls:{default:{http:[\"https://rpc.test.mezo.org\"]}},blockExplorers:{default:{name:\"Mezo Testnet Explorer\",url:\"https://explorer.test.mezo.org\"}},testnet:true},{id:31612,name:\"Mezo\",nativeCurrency:{decimals:18,name:\"Bitcoin\",symbol:\"BTC\"},rpcUrls:{default:{http:[\"https://rpc.mezo.org\"]}},blockExplorers:{default:{name:\"Mezo Explorer\",url:\"https://explorer.mezo.org\"}}}]";

let src = fs.readFileSync(f, "utf8");

// Match ALL variants: Object.values(cx).find(X=>X.id===V)
const pattern = /Object\.values\(cx\)\.find\(([a-z])=>\1\.id===([a-zA-Z])\)/g;
let count = 0;
src = src.replace(pattern, (match, arg, id) => {
  count++;
  return match + "||" + MEZO + ".find(" + arg + "=>" + arg + ".id===" + id + ")";
});

if (count === 0) {
  console.error("patch-paywall: no chain lookup patterns found");
  process.exit(1);
}

fs.writeFileSync(f, src);
console.log("patch-paywall: patched " + count + " chain lookup(s)");
' "$PAYWALL_EVM"
