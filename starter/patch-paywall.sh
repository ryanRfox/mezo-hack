#!/usr/bin/env bash
# Inject Mezo chain definitions into @x402/paywall's bundled viem.
#
# WHY: @x402/paywall@2.9.0 bundles a viem that predates Mezo chain support.
# The paywall can't look up chain 31611 and fails. This patch adds a
# fallback array with Mezo Testnet + Mainnet chain objects.
#
# WHEN TO REMOVE: Once @x402/paywall >= 2.10.0 ships with x402-foundation/x402
# PR #1920 (merged 2026-04-11), the bundled viem will include Mezo natively
# and this patch becomes unnecessary. Delete this file and remove the
# "postinstall" script from package.json.
set -euo pipefail

PAYWALL_EVM="node_modules/@x402/paywall/dist/esm/evm/index.js"
[ -f "$PAYWALL_EVM" ] || { echo "patch-paywall: @x402/paywall not found, skipping"; exit 0; }
grep -q "Mezo Testnet" "$PAYWALL_EVM" && { echo "patch-paywall: already patched"; exit 0; }

echo "patch-paywall: injecting Mezo chain definitions..."

node -e '
const fs = require("fs");
const f = process.argv[1];
const old = "Object.values(cx).find(z=>z.id===Y)";
const mezo = JSON.stringify([
  {id:31611,name:"Mezo Testnet",nativeCurrency:{decimals:18,name:"Bitcoin",symbol:"BTC"},rpcUrls:{default:{http:["https://rpc.test.mezo.org"]}},blockExplorers:{default:{name:"Mezo Testnet Explorer",url:"https://explorer.test.mezo.org"}},testnet:true},
  {id:31612,name:"Mezo",nativeCurrency:{decimals:18,name:"Bitcoin",symbol:"BTC"},rpcUrls:{default:{http:["https://rpc.mezo.org"]}},blockExplorers:{default:{name:"Mezo Explorer",url:"https://explorer.mezo.org"}}}
]).replace(/"/g, String.raw`\"`);
const src = fs.readFileSync(f, "utf8");
if (!src.includes(old)) { console.error("patch-paywall: target string not found"); process.exit(1); }
const patched = src.replace(old, old + "||" + mezo + ".find(z=>z.id===Y)");
fs.writeFileSync(f, patched);
console.log("patch-paywall: done (" + (src.split(old).length - 1) + " occurrence(s))");
' "$PAYWALL_EVM"
