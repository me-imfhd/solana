import { explorerURL, loadPublicKeysFromFile } from "@/lib/helpers";
import { connection, payer } from "@/lib/vars";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

export async function mint_token() {
  let localKeys = loadPublicKeysFromFile();

  if (!localKeys.tokenMint) {
    throw new Error(
      "No local keys were found. Please run '3.createTokenWithMetadata.ts' "
    );
  }
  const tokenMint = localKeys.tokenMint as PublicKey;

  console.log("Token Mint Account Address:", tokenMint.toBase58());

  /**
   * SPL tokens are owned using a special relationship where the actual tokens
   * are stored/owned by a different account, which is then owned by the user's
   * wallet/account
   * This special account is called "associated token account" (or "ata" for short)
   * ---
   * think of it like this: tokens are stored in the ata for each "tokenMint",
   * the ata is then owned by the user's wallet
   */
  const walletAddrOfAssociatedAcc = new PublicKey(
    "8arb6yXMiQKrsrYqTRubaHrZWXyfDsB8wyeDUh2iagK3"
  );

  const ataAddress = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    tokenMint,
    walletAddrOfAssociatedAcc
  ).then((ata) => ata.address);
  console.log("ATA address:", ataAddress.toBase58());

  /*
    note: when creating an ata, the instruction will allocate space on chain
    if you attempt to allocate space at an existing address on chain, the transaction will fail.
    ---
    sometimes, it may be useful to directly create the ata when you know it has not already been created on chain
    you can see how to do that below
  */
  /**
   * The number of tokens to mint takes into account the `decimal` places set on your `tokenMint`.
   * So ensure you are minting the correct, desired number of tokens.
   * ---
   * examples:
   * - if decimals=2, amount=1_000 => actual tokens minted == 10
   * - if decimals=2, amount=10_000 => actual tokens minted == 100
   * - if decimals=2, amount=10 => actual tokens minted == 0.10
   */
  const amtOfTokenToMint = 1_000;

  // mint token to ata
  const mintSig = await mintTo(
    connection,
    payer,
    tokenMint,
    ataAddress,
    payer,
    amtOfTokenToMint
  );
  console.log(explorerURL({ txSignature: mintSig }));
}
