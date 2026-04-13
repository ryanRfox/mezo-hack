import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { config } from "dotenv";
import express from "express";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

config();

const PAYEE_ADDRESS = process.env.PAYEE_ADDRESS as `0x${string}`;
if (!PAYEE_ADDRESS) {
  console.error("PAYEE_ADDRESS is required. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const PORT = Number(process.env.PORT ?? 3000);
const FACILITATOR_URL = process.env.FACILITATOR_URL ?? "https://facilitator.vativ.io";
// SHIM: Mezo Testnet (eip155:31611) is not in @x402/evm@2.9.0's DEFAULT_STABLECOINS
// registry. Restored upstream in x402-foundation/x402 PR #1920 but not yet published.
// When @x402/evm >= 2.10.0 ships, drop this constant — ExactEvmScheme will resolve
// mUSD from the registry automatically.
const MUSD_ADDRESS = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503";
const JOKES_PATH = join(import.meta.dirname, "jokes.json");

const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const app = express();

// Hand-rolled browser paywall — connects MetaMask, signs Permit2, pays, shows joke.
// No @x402/paywall dependency (broken on Mezo due to SES + missing chain defs).
// Loads viem + @x402 client libs from esm.sh at runtime to bypass SES lockdown.
const paywallHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Payment Required - Mezo x402 Starter</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;background:#f5f5f7;display:flex;justify-content:center;align-items:center;padding:1rem;font-family:system-ui,sans-serif}
.card{background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:440px;width:100%;padding:2.5rem;text-align:center}
h1{font-size:1rem;color:#666;font-weight:500;letter-spacing:.05em;text-transform:uppercase;margin-bottom:1rem}
.price{font-size:2.5rem;font-weight:700;color:#1a1a2e;margin-bottom:.15rem}
.sub{color:#888;font-size:.85rem;margin-bottom:1.5rem}
.btn{width:100%;padding:.85rem;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer;transition:background .15s}
.btn-primary{background:#2563eb;color:#fff}.btn-primary:hover{background:#1d4ed8}
.btn-success{background:#059669;color:#fff}
.btn:disabled{opacity:.5;cursor:not-allowed}
.info{background:#f9fafb;border-radius:8px;padding:.75rem 1rem;margin-bottom:1rem;font-size:.85rem;text-align:left}
.info-row{display:flex;justify-content:space-between;margin-bottom:.25rem}
.info-row:last-child{margin-bottom:0}
.label{color:#666}.val{font-weight:500;font-family:monospace;font-size:.8rem}
.result{margin-top:1.5rem;text-align:left}
.joke-setup{font-size:1.1rem;font-weight:600;margin-bottom:.5rem}
.joke-punch{font-size:1rem;color:#333;margin-bottom:1rem}
.tx{font-size:.75rem;word-break:break-all}
.tx a{color:#2563eb;text-decoration:none}
.error{color:#dc2626;font-size:.85rem;margin-top:.75rem}
.status{color:#666;font-size:.85rem;margin-top:.75rem}
.hidden{display:none}
.links{margin-top:1.5rem;font-size:.8rem;color:#888}
.links a{color:#2563eb;text-decoration:none}
</style></head><body><div class="card">
<h1>402 Payment Required</h1>
<div class="price">0.001 mUSD</div>
<div class="sub">Mezo Testnet &middot; Permit2 &middot; per request</div>

<div id="connect-section">
  <button class="btn btn-primary" id="connectBtn" onclick="connectWallet()">Connect MetaMask</button>
</div>

<div id="wallet-section" class="hidden">
  <div class="info">
    <div class="info-row"><span class="label">Wallet</span><span class="val" id="addr"></span></div>
    <div class="info-row"><span class="label">mUSD Balance</span><span class="val" id="bal">...</span></div>
    <div class="info-row"><span class="label">Network</span><span class="val" id="net"></span></div>
  </div>
  <button class="btn btn-primary" id="payBtn" onclick="payForJoke()">Pay 0.001 mUSD &amp; Unlock</button>
</div>

<div id="result-section" class="hidden">
  <div class="result">
    <div class="joke-setup" id="setup"></div>
    <div class="joke-punch" id="punchline"></div>
    <div class="tx">Tx: <a id="txLink" target="_blank"></a></div>
  </div>
  <button class="btn btn-success" style="margin-top:1rem" onclick="location.reload()">Get Another Joke</button>
</div>

<div id="status" class="status hidden"></div>
<div id="error" class="error hidden"></div>

<div class="links">
  <a href="https://faucet.mezo.org" target="_blank">Get testnet mUSD</a> &middot;
  <a href="https://explorer.test.mezo.org" target="_blank">Explorer</a>
</div>
</div>

<script>
// BigInt JSON serialization — viem and x402 use BigInt for token amounts,
// but native JSON.stringify throws on BigInt. This shim is required.
if (typeof BigInt !== "undefined") { BigInt.prototype.toJSON = function() { return this.toString(); }; }

// Minimal glue code — no ??, no optional chaining, SES-safe.
// All heavy crypto loaded from esm.sh via dynamic import().
var account = null;
var x402Libs = null;

function show(id) { document.getElementById(id).classList.remove("hidden"); }
function hide(id) { document.getElementById(id).classList.add("hidden"); }
function setStatus(msg) { document.getElementById("status").textContent = msg; show("status"); }
function setError(msg) { document.getElementById("error").textContent = msg; show("error"); }
function clearError() { hide("error"); }

async function connectWallet() {
  clearError();
  if (typeof window.ethereum === "undefined") {
    setError("MetaMask not found. Install it from metamask.io");
    return;
  }
  try {
    setStatus("Connecting...");
    var accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    account = accounts[0];
    document.getElementById("addr").textContent = account.slice(0, 6) + "..." + account.slice(-4);

    // Check chain
    var chainId = await window.ethereum.request({ method: "eth_chainId" });
    var chainNum = parseInt(chainId, 16);
    document.getElementById("net").textContent = chainNum === 31611 ? "Mezo Testnet" : "Chain " + chainNum;

    if (chainNum !== 31611) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x7b7b" }]
        });
        document.getElementById("net").textContent = "Mezo Testnet";
      } catch (e) {
        if (e.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x7b7b",
              chainName: "Mezo Testnet",
              nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
              rpcUrls: ["https://rpc.test.mezo.org"],
              blockExplorerUrls: ["https://explorer.test.mezo.org"]
            }]
          });
          document.getElementById("net").textContent = "Mezo Testnet";
        }
      }
    }

    // Load viem for balance check
    var viem = await import("https://esm.sh/viem@2.47.12");
    var bal = await viem.createPublicClient({
      chain: { id: 31611, name: "Mezo Testnet", nativeCurrency: { decimals: 18, name: "Bitcoin", symbol: "BTC" }, rpcUrls: { default: { http: ["https://rpc.test.mezo.org"] } } },
      transport: viem.http("https://rpc.test.mezo.org")
    }).readContract({
      address: "${MUSD_ADDRESS}",
      abi: [{ name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] }],
      functionName: "balanceOf",
      args: [account]
    });
    document.getElementById("bal").textContent = viem.formatUnits(bal, 18) + " mUSD";

    hide("connect-section");
    show("wallet-section");
    hide("status");
  } catch (e) {
    setError("Connect failed: " + (e.message || e));
    hide("status");
  }
}

async function payForJoke() {
  clearError();
  try {
    setStatus("Loading payment libraries...");
    document.getElementById("payBtn").disabled = true;

    // Load x402 client + EVM scheme from esm.sh
    if (!x402Libs) {
      var [fetchMod, evmClientMod, evmMod, viemMod] = await Promise.all([
        import("https://esm.sh/@x402/fetch@2.9.0"),
        import("https://esm.sh/@x402/evm@2.9.0/exact/client"),
        import("https://esm.sh/@x402/evm@2.9.0"),
        import("https://esm.sh/viem@2.47.12")
      ]);
      x402Libs = { fetchMod: fetchMod, evmClientMod: evmClientMod, evmMod: evmMod, viemMod: viemMod };
    }

    var viemMod = x402Libs.viemMod;
    var evmMod = x402Libs.evmMod;
    var evmClientMod = x402Libs.evmClientMod;
    var fetchMod = x402Libs.fetchMod;

    setStatus("Preparing signer...");

    // Create a MetaMask-backed signer compatible with @x402/evm
    var publicClient = viemMod.createPublicClient({
      chain: { id: 31611, name: "Mezo Testnet", nativeCurrency: { decimals: 18, name: "Bitcoin", symbol: "BTC" }, rpcUrls: { default: { http: ["https://rpc.test.mezo.org"] } } },
      transport: viemMod.http("https://rpc.test.mezo.org")
    });

    var signer = evmMod.toClientEvmSigner(
      {
        address: account,
        signTypedData: async function(msg) {
          return window.ethereum.request({
            method: "eth_signTypedData_v4",
            params: [account, JSON.stringify({
              domain: msg.domain,
              types: msg.types,
              primaryType: msg.primaryType,
              message: msg.message
            })]
          });
        }
      },
      {
        readContract: function(args) {
          return publicClient.readContract(args);
        }
      }
    );

    // Build x402 client and wrap fetch
    var client = new fetchMod.x402Client();
    client.register("eip155:*", new evmClientMod.ExactEvmScheme(signer));
    var payFetch = fetchMod.wrapFetchWithPayment(fetch.bind(window), client);

    setStatus("Signing payment (check MetaMask)...");
    var response = await payFetch(location.origin + "/joke", {
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
      throw new Error("Payment failed: " + response.status);
    }

    var joke = await response.json();
    // Use SDK's decodePaymentResponseHeader for x402 v2 response format
    var payHeader = response.headers.get("PAYMENT-RESPONSE");
    var txHash = "unknown";
    if (payHeader && fetchMod.decodePaymentResponseHeader) {
      try {
        var decoded = fetchMod.decodePaymentResponseHeader(payHeader);
        txHash = decoded.transaction || "unknown";
      } catch(e) { /* header decode failed — show unknown */ }
    }

    // Show result
    document.getElementById("setup").textContent = joke.setup;
    document.getElementById("punchline").textContent = joke.punchline;
    var txLink = document.getElementById("txLink");
    txLink.textContent = txHash.slice(0, 10) + "..." + txHash.slice(-8);
    txLink.href = "https://explorer.test.mezo.org/tx/" + txHash;

    hide("wallet-section");
    show("result-section");
    hide("status");
  } catch (e) {
    setError(e.message || "Payment failed");
    hide("status");
    document.getElementById("payBtn").disabled = false;
  }
}
</script>
</div></body></html>`;

app.use(
  paymentMiddleware(
    {
      "GET /joke": {
        accepts: {
          scheme: "exact",
          network: "eip155:31611",
          payTo: PAYEE_ADDRESS,
          price: {
            amount: "1000000000000000", // 0.001 mUSD (18 decimals)
            asset: MUSD_ADDRESS,
            extra: {
              name: "Mezo USD",
              version: "1",
              decimals: 18,
              assetTransferMethod: "permit2",
              supportsEip2612: true,
            },
          },
          maxTimeoutSeconds: 300,
        },
        description: "Unlock a Bitcoin joke",
        mimeType: "application/json",
        customPaywallHtml: paywallHtml,
      },
    },
    new x402ResourceServer(facilitatorClient).register("eip155:*", new ExactEvmScheme()),
  ),
);

app.get("/joke", async (_req, res) => {
  const jokes = JSON.parse(await readFile(JOKES_PATH, "utf-8"));
  res.json(jokes[Math.floor(Math.random() * jokes.length)]);
});

app.listen(PORT, () => {
  console.log(`Mezo x402 starter on http://localhost:${PORT} — GET /joke (0.001 mUSD → ${PAYEE_ADDRESS})`);
});
