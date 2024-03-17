/**
 * Demonstrates how to mint NFTs and store their metadata on chain using the Metaplex MetadataProgram
 */

import {
  explorerURL,
  loadPublicKeysFromFile,
  printConsoleSeparator,
} from "@/lib/helpers";
import { connection, payer } from "@/lib/vars";
import {
  Metaplex,
  PublicKey,
  UploadMetadataInput,
  bundlrStorage,
  keypairIdentity,
  toMetaplexFile,
} from "@metaplex-foundation/js";
import fs from "fs";

export async function create_nft() {
  const metadata = {
    name: "The Gradient Pearl",
    symbol: "SHIP",
    description:
      "The Gradient Pearl is a legendary Pirate ship that sails the Seven Seas. Captain Rajovenko leads with a drink can in his hand. ",
    image:
      "https://bafybeic75qqhfytc6xxoze2lo5af2lfhmo2kh4mhirelni2wota633dgqu.ipfs.nftstorage.link/",
  } as UploadMetadataInput;

  /**
   * Use the Metaplex sdk to handle most NFT actions
   */

  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(payer))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
    );

  const { uri } = await metaplex.nfts().uploadMetadata(metadata);
  console.log("metadata uploaded");

  printConsoleSeparator();

  console.log("creating nft");

  const { nft, response } = await metaplex.nfts().create({
    name: metadata.name as string,
    uri,
    // `sellerFeeBasisPoints` is the royalty that you can define on nft
    sellerFeeBasisPoints: 500, // Represents 5.00%.
    isMutable: true,
  });

  printConsoleSeparator("Nft created:");
  console.log(explorerURL({ txSignature: response.signature }));

  printConsoleSeparator("Find by mint:");

  // you can also use the metaplex sdk to retrieve info about the NFT's mint
  let localKeys = loadPublicKeysFromFile();

  // ensure the desired script was already run
  if (!localKeys?.tokenMint)
    return console.warn(
      "No local keys were found. Please run '3.createTokenWithMetadata.ts'"
    );

  const tokenMint: PublicKey = localKeys.tokenMint;

  console.log(explorerURL({ address: tokenMint.toBase58() }));
  const mintInfo = await metaplex.nfts().findByMint({
    mintAddress: tokenMint,
  });
  console.log(mintInfo);
}
