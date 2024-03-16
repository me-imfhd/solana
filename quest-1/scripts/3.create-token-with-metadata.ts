/**
 * Demonstrates how to create a SPL token and store it's metadata on chain (using the Metaplex MetaData program)
 */

import { connection, payer, testWallet } from "@/lib/vars";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMint2Instruction,
  createMint,
} from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  PROGRAM_ID as METADATA_PROGRAM_ID,
  createCreateMetadataAccountV3Instruction,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  buildTransaction,
  explorerURL,
  extractSignatureFromFailedTransaction,
  printConsoleSeparator,
  savePublicKeyToFile,
} from "@/lib/helpers";

export async function create_token_with_metadata() {
  // generate a new keypair to be used for our mint
  const mintKeypair = Keypair.generate();
  // define the assorted token config settings
  const tokenConfig = {
    // define how many decimals we want our tokens to have
    decimals: 2,
    //
    name: "Seven Seas Gold",
    //
    symbol: "GOLD",
    //
    uri: "https://thisisnot.arealurl/info.json",
  };

  /**
   * Build the 2 instructions required to create the token mint:
   * - standard "create account" to allocate space on chain
   * - initialize the token mint
   */
  const createMintAccIx = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    lamports: await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
    space: MINT_SIZE,
    newAccountPubkey: mintKeypair.publicKey,
    programId: TOKEN_PROGRAM_ID,
  });
  // we require to do this to make our mint accout special than normal accounts, by setting these common configurations,
  // and now it will be ready for minting tokens
  const initMintIx = createInitializeMint2Instruction(
    mintKeypair.publicKey,
    tokenConfig.decimals,
    payer.publicKey,
    payer.publicKey
  );

  //   or use this helper function to create and initialize a new mint
  //   console.log("Creating a token mint...");
  //   const mint = await createMint(
  //     connection,
  //     payer,
  //     // mint authority
  //     payer.publicKey,
  //     // freeze authority
  //     payer.publicKey,
  //     // decimals - use any number you desire
  //     tokenConfig.decimals,
  //     // manually define our token mint address
  //     mintKeypair,
  //   );
  //   console.log("Token's mint address:", mint.toBase58());

  /**
   * Build the instruction to store the token's metadata on chain
   * - derive the pda for the metadata account
   * - create the instruction with the actual metadata in it
   */

  // pda program public key, note it does not have private key, since this can be only invoked by metadata program by metaplex
  // and does not require user's signature, but its parent program requires to fire it
  const metadataAccount = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mintKeypair.publicKey.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  )[0];

  console.log("Metadata address:", metadataAccount.toBase58());

  // this creates a program derived metadata account which is derieved from bunch of stuff above
  const createMetadataIx = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataAccount,
      mint: mintKeypair.publicKey,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          creators: null,
          collection: null,
          name: tokenConfig.name,
          symbol: tokenConfig.symbol,
          uri: tokenConfig.uri,
          sellerFeeBasisPoints: 0,
          uses: null,
        },
        // `collectionDetails` - for non-nft type tokens, normally set to `null` to not have a value set
        collectionDetails: null,
        // should metadata be updatable
        isMutable: true,
      },
    }
  );

  const tx = await buildTransaction({
    connection,
    instructions: [createMintAccIx, initMintIx, createMetadataIx],
    payer: payer.publicKey,
    signers: [payer, mintKeypair],
  });

  printConsoleSeparator();

  try {
    const sig = await connection.sendTransaction(tx);
    console.log("Transaction completed.");
    console.log(explorerURL({ txSignature: sig }));

    // locally save our addresses for the demo
    savePublicKeyToFile("tokenMint", mintKeypair.publicKey);
    return {
      txSignature: sig,
      mintAccountKeyPair: mintKeypair,
      metadataAccountPublicKey: metadataAccount,
    };
  } catch (err) {
    console.error("Failed to  send transaction");
    console.log(tx);

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
