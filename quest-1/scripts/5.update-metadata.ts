/**
 * Demonstrates how to update the metadata for an SPL token, using the Metaplex MetadataProgram
 */

import {
  buildTransaction,
  explorerURL,
  extractSignatureFromFailedTransaction,
  loadPublicKeysFromFile,
  printConsoleSeparator,
} from "@/lib/helpers";
import { connection, payer } from "@/lib/vars";
import {
  PROGRAM_ID as METADATA_PROGRAM_ID,
  createUpdateMetadataAccountV2Instruction,
} from "@metaplex-foundation/mpl-token-metadata";
import { PublicKey } from "@solana/web3.js";

export async function update_metadata() {
  // get mint
  let localKeys = loadPublicKeysFromFile();

  if (!localKeys.tokenMint) {
    throw new Error("mint not found, run third script to generate it");
  }
  const tokenMint: PublicKey = localKeys.tokenMint;
  console.log(explorerURL({ address: tokenMint.toBase58() }));

  // new token config setting
  const tokenConfig = {
    // new name
    name: "New Super Sweet Token",
    // new symbol
    symbol: "nSST",
    // new uri
    uri: "https://thisisnot.arealurl/new.json",
  };

  /**
   * Build the instruction to store the token's metadata on chain
   * - derive the pda for the metadata account
   * - create the instruction with the actual metadata in it
   */

  const metadataAccount = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      tokenMint.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  )[0];

  const updateMetadataIx = createUpdateMetadataAccountV2Instruction(
    {
      metadata: metadataAccount,
      updateAuthority: payer.publicKey,
    },
    {
      updateMetadataAccountArgsV2: {
        data: {
          creators: null,
          name: tokenConfig.name,
          symbol: tokenConfig.symbol,
          uri: tokenConfig.uri,
          sellerFeeBasisPoints: 0,
          collection: null,
          uses: null,
        },
        isMutable: true,
        updateAuthority: payer.publicKey,
        primarySaleHappened: null,
      },
    }
  );

  const tx = await buildTransaction({
    connection,
    instructions: [updateMetadataIx],
    payer: payer.publicKey,
    signers: [payer],
  });

  printConsoleSeparator();

  try {
    const sig = await connection.sendTransaction(tx);

    console.log(explorerURL({ txSignature: sig }));
  } catch (err) {
    console.error("Failed to send transaction:");
    // console.log(tx);

    // attempt to extract the signature from the failed transaction
    const failedSig = await extractSignatureFromFailedTransaction(
      connection,
      err
    );
    if (failedSig)
      console.log("Failed signature:", explorerURL({ txSignature: failedSig }));

    throw err;
  }
}
