import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Collection } from "../target/types/collection";
import { PROGRAM_ID as METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

describe("collection", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as anchor.Wallet;

  anchor.setProvider(provider);

  const program = anchor.workspace.Collection as Program<Collection>;
  const metadata = {
    name: "My Anchored NFT",
    sellerFeeBasisPoints: 500,
    symbol: "ANFT",
    uri: "https://raw.githubusercontent.com/Coding-and-Crypto/Solana-NFT-Marketplace/master/assets/example.json",
  };
  it("MintNFT", async () => {
    // Derive Mint address and ata address
    const mintKeyPair: anchor.web3.Keypair = anchor.web3.Keypair.generate();
    console.log(`New token: ${mintKeyPair.publicKey}`);
    // pda
    const ata = await anchor.utils.token.associatedAddress({
      mint: mintKeyPair.publicKey,
      owner: wallet.publicKey,
    });

    // Derive Metadata and Master Edition Addresses
    const metadataAddress = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        mintKeyPair.publicKey.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    )[0];
    console.log("Metadata initialized");
    const masterEditionMetadataAddress =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          METADATA_PROGRAM_ID.toBuffer(),
          mintKeyPair.publicKey.toBuffer(),
          Buffer.from("master"),
        ],
        METADATA_PROGRAM_ID
      )[0];
    console.log("Master edition metadata initialized");
    await program.methods
      .createMintCreateAtaMintToAta(
        metadata.name,
        metadata.symbol,
        metadata.uri,
        metadata.sellerFeeBasisPoints
      )
      // pass unchecked accounts and signer, others are resolved by anchor
      .accounts({
        masterEditionMetadataAccount: masterEditionMetadataAddress,
        metadataAccount: metadataAddress,
        mintAccount: mintKeyPair.publicKey,
        mintAuthority: wallet.publicKey,
        tokenAccount: ata,
        tokenMetadataProgram: METADATA_PROGRAM_ID,
      })
      .signers([mintKeyPair])
      .rpc({ skipPreflight: true });
  });
});
