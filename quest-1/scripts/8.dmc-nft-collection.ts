import { explorerURL, printConsoleSeparator } from "@/lib/helpers";
import { connection, payer } from "@/lib/vars";
import {
  CreateCandyMachineInput,
  DefaultCandyGuardSettings,
  Metaplex,
  UploadMetadataInput,
  bundlrStorage,
  keypairIdentity,
  sol,
  toBigNumber,
  toDateTime,
  toMetaplexFile,
} from "@metaplex-foundation/js";
import { PublicKey } from "@solana/web3.js";
import fs from "fs";

const collectionURI =
  "https://arweave.net/zLHyGxkJ6L33FhTHsJX5speEl4FMfcUSIIyipKTFIsI";
const COLLECTION_NFT_MINT = "4VyaeoNGRGfQoMmwACRQJ9sRsX6hM2L4U4YWWtpurbdm";
const CANDY_MACHINE_ID = "EDx7RTfi8NDXfTUbaWPpBYPaExboqiSKVPgPsRzJfh4";
const metaplex = Metaplex.make(connection)
  .use(keypairIdentity(payer))
  .use(
    bundlrStorage({
      address: "https://devnet.bundlr.network",
      providerUrl: "https://api.devnet.solana.com",
      timeout: 60000,
    })
  );
const collectionSize = 3;
export async function dmc_nft_collection() {
  // const res = await create_collection(); // create collection mint
  // const res = await generateCandyMachine(); // create candy machine with settings
  // const res = await updateCandyMachine(); // update candy machine settings
  // const res = await addItems(); // add items based on candy machine settings
  // const res = await mintNft(); // mint nfts that were added by addItems and run collectionSize number or times
}
async function mintNft() {
  let candyMachine = await metaplex.candyMachines().findByAddress({
    address: new PublicKey(CANDY_MACHINE_ID),
  });
  let { nft, response } = await metaplex.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: payer.publicKey,
    },
    { commitment: "finalized" }
  );

  candyMachine = await metaplex.candyMachines().refresh(candyMachine);

  console.log(`✅ - Minted NFT: ${nft.address.toString()}`);
  console.log(
    `     https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
  );
  console.log(
    `     https://explorer.solana.com/tx/${response.signature}?cluster=devnet`
  );
}
async function addItems() {
  let candyMachine = await metaplex
    .candyMachines()
    .findByAddress({ address: new PublicKey(CANDY_MACHINE_ID) });
  const items = [];
  const vergil = await vergilUri(metaplex);
  const dante = await danteURI(metaplex);
  const nero = await neroUri(metaplex);
  items.push({
    name: vergil.name,
    uri: vergil.uri,
  });
  items.push({
    name: dante.name,
    uri: dante.uri,
  });
  items.push({
    name: nero.name,
    uri: nero.uri,
  });
  const { response } = await metaplex.candyMachines().insertItems(
    {
      candyMachine,
      items: items,
    },
    { commitment: "finalized" }
  );
  candyMachine = await metaplex.candyMachines().refresh(candyMachine);

  console.log(`✅ - Items added to Candy Machine: ${CANDY_MACHINE_ID}`);
  console.log(
    `     https://explorer.solana.com/tx/${response.signature}?cluster=devnet`
  );
}
async function updateCandyMachine() {
  let candyMachine = await metaplex
    .candyMachines()
    .findByAddress({ address: new PublicKey(CANDY_MACHINE_ID) });

  const { response } = await metaplex.candyMachines().update({
    candyMachine,
    guards: {
      mintLimit: { id: 255, limit: collectionSize },
      solPayment: {
        amount: sol(1.5),
        destination: metaplex.identity().publicKey,
      },
    },
  });

  candyMachine = await metaplex.candyMachines().refresh(candyMachine);

  console.log(`✅ - Updated Candy Machine: ${CANDY_MACHINE_ID}`);
  console.log(
    `     https://explorer.solana.com/tx/${response.signature}?cluster=devnet`
  );
}
async function generateCandyMachine() {
  const candyMachineSettings: CreateCandyMachineInput<DefaultCandyGuardSettings> =
    {
      itemsAvailable: toBigNumber(collectionSize), // Collection Size: 3
      sellerFeeBasisPoints: 1000, // 10% Royalties on Collection
      symbol: "DMC",
      maxEditionSupply: toBigNumber(0), // 0 reproductions of each NFT allowed
      isMutable: true,
      creators: [{ address: payer.publicKey, share: 100 }],
      collection: {
        address: new PublicKey(COLLECTION_NFT_MINT), // Can replace with your own NFT or upload a new one
        updateAuthority: payer,
      },
    };
  const { candyMachine } = await metaplex
    .candyMachines()
    .create(candyMachineSettings);
  console.log(`✅ - Created Candy Machine: ${candyMachine.address.toString()}`);
  console.log(
    `     https://explorer.solana.com/address/${candyMachine.address.toString()}?cluster=devnet`
  );
}
async function create_collection() {
  const metadata = {
    name: "Devil May Cry - NFT Collection",
    symbol: "Demon",
    image: await upload_image(metaplex, "/uploads/dmc.jpg", "dmc"),
    description:
      "Devil May Cry is an urban fantasy action-adventure game franchise created by Hideki Kamiya. It is primarily developed and published by Capcom. The series centers on the demon hunter Dante and his efforts to thwart various demon invasions of Earth.",
  };
  const { uri } = await metaplex.nfts().uploadMetadata(metadata);
  printConsoleSeparator(`Metadata uploaded: ${uri}`);

  await createCollectionNft(metaplex, uri, metadata);
}

async function createCollectionNft(
  metaplex: Metaplex,
  uri: string,
  metadata: any
) {
  const { nft: collectionNft } = await metaplex.nfts().create({
    name: metadata.name,
    uri,
    isMutable: true,
    symbol: metadata.symbol,
    sellerFeeBasisPoints: 0,
    isCollection: true,
    updateAuthority: payer,
  });

  console.log(
    `✅ - Minted Collection NFT: ${collectionNft.address.toString()}`
  );
  console.log(
    `     https://explorer.solana.com/address/${collectionNft.address.toString()}?cluster=devnet`
  );
}

async function upload_image(
  metaplex: Metaplex,
  path: string,
  imageName: string
) {
  const buffer = fs.readFileSync(__dirname + path);
  const file = toMetaplexFile(buffer, `${imageName}.jpg`);
  const imageUri = await metaplex.storage().upload(file);
  return imageUri;
}

async function danteURI(metaplex: Metaplex) {
  const metadata = {
    name: "Dante - Son of Sparda",
    description:
      "Dante, also known under the alias of Tony Redgrave, is a character and the main protagonist in Devil May Cry, an action-adventure hack and slash video game series by Japanese developer and publisher Capcom.",
    image: await upload_image(metaplex, "/uploads/dante.jpg", "dante"),
    symbol: "Rebellion",
  };
  const { uri } = await metaplex.nfts().uploadMetadata(metadata);
  console.log(uri);
  console.log("uploaded dante uri");
  return {
    name: metadata.name,
    uri,
  };
}
async function vergilUri(metaplex: Metaplex) {
  const metadata = {
    name: "Vergil - Son of Sparda",
    description:
      "Vergil is one of two devil-human hybrid sons of one of the devil lords called Sparda, and possesses demonic powers.",
    image: await upload_image(metaplex, "/uploads/vergil.jpg", "vergil"),
    symbol: "Yamato",
  };
  const { uri } = await metaplex.nfts().uploadMetadata(metadata);
  console.log("uploaded vergil uri");

  return {
    name: metadata.name,
    uri,
  };
}
async function neroUri(metaplex: Metaplex) {
  const metadata = {
    name: "Nero - Son of Vergil",
    description:
      "Nero is a character in the Devil May Cry video game series who is a quarter demon, the son of Vergil, and the nephew of Dante.",
    image: await upload_image(metaplex, "/uploads/nero.jpg", "nero"),
    symbol: "The Red Queen",
  };

  const { uri } = await metaplex.nfts().uploadMetadata(metadata);
  console.log("uploaded nero uri");
  return {
    name: metadata.name,
    uri,
  };
}

const danteNFT = "HWo8GkzK4cZgcG7oD35Moav7G6C1EerauC5pGAB1CpmT";
const vergilNFT = "ByZDvjfUW6boQ2XKuiW5axbnH7AxH5YxprVKNMV6QYUU";
const neroNFT = "4z6rbMnYqhcfW28jeqoDeb5LmTV9a57h5RttcNLvQgUn";
