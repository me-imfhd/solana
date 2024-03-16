import { explorerURL, printConsoleSeparator } from "@/lib/helpers";
import { connection, payer } from "@/lib/vars";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

export async function create_account_with_local_key_pair() {
  console.log("Payer address:", payer.publicKey.toBase58());

  // get the current balance of the `payer` account on chain
  const currentBalance = await connection.getBalance(payer.publicKey);
  console.log("Current balance of 'payer' (in lamports):", currentBalance);
  console.log(
    "Current balance of 'payer' (in SOL):",
    currentBalance / LAMPORTS_PER_SOL
  );
  // airdrop on low balance
  if (currentBalance <= LAMPORTS_PER_SOL) {
    console.log("Low balance, requesting an airdrop...");
    await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
  }
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  // generate a new, random address to create on chain
  const keypair = Keypair.generate();
  console.log("New keypair generated:", keypair.publicKey.toBase58());

  /**
   * create a simple instruction (using web3.js) to create an account
   */

  // on-chain space to allocated (in number of bytes)
  const space = 0;
  // request the cost (in lamports) to allocate `space` number of bytes on chain
  const lamports = await connection.getMinimumBalanceForRentExemption(space);

  console.log(
    `Cost to allocate ${space} bytes space on chain in lamports:`,
    lamports
  );

  // create this simple instruction using web3.js helper function
  const createAccountIx = SystemProgram.createAccount({
    // `fromPubkey` - this account will need to sign the transaction
    fromPubkey: payer.publicKey,
    // `newAccountPubkey` - the account address to create on chain
    newAccountPubkey: keypair.publicKey,
    // lamports to store in this account
    lamports: lamports,
    // total space to allocate
    space,
    // the owning program for this account
    programId: SystemProgram.programId,
  });

  /**
   * build the transaction to send to the blockchain
   */

  // get the latest recent blockhash
  const blockhash = await connection
    .getLatestBlockhash()
    .then((res) => res.blockhash);
  // create a message (v0)
  const message = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: blockhash,
    instructions: [createAccountIx],
  }).compileToV0Message();

  // create a versioned transaction using the message
  const tx = new VersionedTransaction(message);
  console.log("tx before signing:", tx);

  // sign the transaction with our needed Signers (e.g. `payer` and `keypair`)
  tx.sign([payer, keypair]);

  console.log(tx.signatures);

  // actually send the transaction
  const sig = await connection.sendTransaction(tx);

  /**
   * display some helper text
   */
  printConsoleSeparator();
  console.log("Transaction completed.");
  console.log(explorerURL({ txSignature: sig }));

  const newAccCurrentBalance = await connection.getBalance(keypair.publicKey);
  const payerCurrentBalance = await connection.getBalance(payer.publicKey);
  return {
    txSignature: sig,
    newAccountKeyPair: keypair,
    payerCurrentBalance,
    newAccCurrentBalance,
  };
}
