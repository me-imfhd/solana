/*
    update ntf image uri
    update symbol and some other metadata
 */

import { explorerURL, printConsoleSeparator } from "@/lib/helpers";
import { connection, payer } from "@/lib/vars";
import {
  Metaplex,
  UploadMetadataInput,
  bundlrStorage,
  keypairIdentity,
  toMetaplexFile,
} from "@metaplex-foundation/js";
import { PublicKey } from "@solana/web3.js";
import fs from "fs";

export async function update_nft() {
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(payer))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
    );
  const buffer = fs.readFileSync(__dirname + "/uploads/vergil.jpg");
  const file = toMetaplexFile(buffer, "image.png");
  const imageUri = await metaplex.storage().upload(file);

  const metadata = {
    name: "Vergil",
    symbol: "Sword",
    description:
      "Vergil is one of two devil-human hybrid sons of one of the devil lords called Sparda, and possesses demonic powers",
    image: imageUri,
  };
  // this uri is a url which returns the json uploaded to decentralized storage
  const { uri, metadata: metaplexMD } = await metaplex
    .nfts()
    .uploadMetadata(metadata);

  const nft = await metaplex.nfts().findByMint({
    mintAddress: new PublicKey("4r53cM66VD6AVbCtNnBuhwcY5rxTiEqEdRhdnRRJtYor"),
  });
  if (!nft || !nft.json) {
    throw new Error("Unable to find existing nft!");
  }
  console.log(`   NFT Found!`);

  const { response } = await metaplex.nfts().update(
    {
      nftOrSft: nft,
      name: metadata.name,
      uri,
      symbol: metadata.symbol,
      sellerFeeBasisPoints: 10000,
    },
    { commitment: "finalized" }
  );

  printConsoleSeparator("Nft updated:");
  console.log(explorerURL({ txSignature: response.signature }));
}
