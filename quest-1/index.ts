import { printConsoleSeparator } from "./lib/helpers";
import { create_account_with_local_key_pair } from "./scripts/1.simple-transactions";
import { create_acc_and_send_sol_to_multiple_wallet } from "./scripts/2.complex-transaction";
import { create_token_with_metadata } from "./scripts/3.create-token-with-metadata";
import { mint_token } from "./scripts/4.mint-token";
import { update_metadata } from "./scripts/5.update-metadata";
import { create_nft } from "./scripts/6.create-nft";

(async () => {
  // 1. Simple transaction -> create account
  //   const res = await create_account_with_local_key_pair();
  // 2. Complex transaction -> create account and send sols to static wallets
  // const res = await create_acc_and_send_sol_to_multiple_wallet();
  // 3. Create Token Account, initaiize it and create metadata account using metaplex
  // const res = await create_token_with_metadata();
  // 4. Mint Tokens -> Get or create ata and set user its owner and mint token in his account using the mint account we initalized
  // const res = await mint_token();
  // 5. Update Metadata -> get mint account, and run create or update metadata instruction
  // const res = await update_metadata();
  // 6. Create NFT -> create nft with metaplex
  // const res = await create_nft();
  // console.log(res);
})();
