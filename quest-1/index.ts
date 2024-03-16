import { printConsoleSeparator } from "./lib/helpers";
import { create_account_with_local_key_pair } from "./scripts/1.simple-transactions";
import { create_acc_and_send_sol_to_multiple_wallet } from "./scripts/2.complex-transaction";
import { create_token_with_metadata } from "./scripts/3.create-token-with-metadata";

(async () => {
  // 1. Simple transaction -> create account
  //   const res = await create_account_with_local_key_pair();
  // 2. Complex transaction -> create account and send sols to static wallets
  // const res = await create_acc_and_send_sol_to_multiple_wallet();
  // 3. Create Token Account, initaiize it and create metadata account using metaplex
  // const res = await create_token_with_metadata();
  // console.log(res);
})();
