import { printConsoleSeparator } from "./lib/helpers";
import { create_account_with_local_key_pair } from "./scripts/1.simple-transactions";
import { create_acc_and_send_sol_to_multiple_wallet } from "./scripts/2.complex-transaction";

(async () => {
  // 1. Simple transaction -> create account
  //   const res = await create_account_with_local_key_pair();
  // 2. Complex transaction -> create account and send sols to static wallets
  // const res = await create_acc_and_send_sol_to_multiple_wallet();
  // console.log(res);
})();
