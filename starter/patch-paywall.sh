#!/usr/bin/env bash
# Inject Mezo chain definitions into @x402/paywall's bundled viem chains.
#
# WHY: The paywall bundles its own viem chains object at compile time.
# Even with viem 2.47.12 as a dep, the bundler only includes chains
# that the paywall code explicitly imports. Mezo Testnet is in viem's
# chain list but not explicitly imported by the paywall, so it's
# missing from the compiled bundle.
#
# WHEN TO REMOVE: When @x402/paywall explicitly imports mezoTestnet
# from viem/chains, or uses a dynamic chain registry instead of a
# static bundle. Track upstream.
set -euo pipefail

PAYWALL_EVM="node_modules/@x402/paywall/dist/esm/evm/index.js"
[ -f "$PAYWALL_EVM" ] || { echo "patch-paywall: @x402/paywall not found, skipping"; exit 0; }
# Check for our specific injection (id:31611 in a chain array), not the
# existing "Mezo Testnet" comment from KNOWN_DECIMALS which is unrelated.
grep -q "id:31611" "$PAYWALL_EVM" && { echo "patch-paywall: already patched"; exit 0; }

echo "patch-paywall: injecting Mezo chain definitions..."

node -e '
const fs = require("fs");
const f = process.argv[1];

const MEZO = "[{id:31611,name:\"Mezo Testnet\",nativeCurrency:{decimals:18,name:\"Bitcoin\",symbol:\"BTC\"},rpcUrls:{default:{http:[\"https://rpc.test.mezo.org\"]}},blockExplorers:{default:{name:\"Mezo Testnet Explorer\",url:\"https://explorer.test.mezo.org\"}},testnet:true},{id:31612,name:\"Mezo\",nativeCurrency:{decimals:18,name:\"Bitcoin\",symbol:\"BTC\"},rpcUrls:{default:{http:[\"https://rpc.mezo.org\"]}},blockExplorers:{default:{name:\"Mezo Explorer\",url:\"https://explorer.mezo.org\"}}}]";

let src = fs.readFileSync(f, "utf8");

// Match: Object.values(<any-var>).find(<arg>=><arg>.id===<var>)
// The bundled viem chains object name changes between builds (cx, y0, etc).
const pattern = /Object\.values\(([a-zA-Z0-9$_]+)\)\.find\(([a-zA-Z])=>\2\.id===([a-zA-Z])\)/g;
let count = 0;
src = src.replace(pattern, (match, obj, arg, id) => {
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
