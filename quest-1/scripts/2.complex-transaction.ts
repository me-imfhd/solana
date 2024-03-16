import { explorerURL, printConsoleSeparator } from "@/lib/helpers";
import { STATIC_PUBLICKEY, connection, payer, testWallet } from "@/lib/vars";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

// creating wallet requires signature of creator and the created wallet,
// but for sending sols you don't want to sign with reciever private key else it would through error
export async function create_acc_and_send_sol_to_multiple_wallet() {
  console.log("Payer address:", payer.publicKey.toBase58());
  console.log("Test wallet address:", testWallet.publicKey.toBase58());
  console.log("Static Wallet address:", STATIC_PUBLICKEY.toBase58());

  /**
   * create a simple instruction (using web3.js) to create an account
   */

  // on-chain space to allocated (in number of bytes)
  const space = 0;
  // request the cost (in lamports) to allocate `space` number of bytes on chain
  const rent = await connection.getMinimumBalanceForRentExemption(space);

  // create this simple instruction using web3.js helper function
  const createAccountIx = SystemProgram.createAccount({
    // `fromPubkey` - this account will need to sign the transaction
    fromPubkey: payer.publicKey,
    // `newAccountPubkey` - the account address to create on chain
    newAccountPubkey: testWallet.publicKey,
    // lamports to store in this account
    lamports: rent + 2_000_000,
    // total space to allocate
    space,
    // the owning program for this account
    programId: SystemProgram.programId,
  });
  // create an instruction to transfer lamports
  const transferToTestWalletIx = SystemProgram.transfer({
    programId: SystemProgram.programId,
    fromPubkey: payer.publicKey,
    toPubkey: testWallet.publicKey,
    lamports: rent + 1_000_000,
  });
  // create an other instruction to transfer lamports to static wallet which would not need to sign txn
  const transferToStaticWalletIx = SystemProgram.transfer({
    programId: SystemProgram.programId,
    fromPubkey: payer.publicKey,
    lamports: 200_000_000,
    toPubkey: STATIC_PUBLICKEY,
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
    instructions: [
      // create the test wallet's account on chain
      createAccountIx,
      // transfer lamports to the static wallet
      transferToStaticWalletIx,
      // transfer lamports to the test wallet
      transferToTestWalletIx,
      // transfer lamports to the static wallet
      transferToStaticWalletIx,
    ],
  }).compileToV0Message();
  console.log("Ix to create test account...");
  console.log("Ix to transfer sol to static wallet...");
  console.log("Ix to transfer sol to test wallet...");
  console.log("Ix to transfer sol to static wallet...");

  const tx = new VersionedTransaction(message); // create tx
  tx.sign([payer, testWallet]); // sign tx
  const sig = await connection.sendTransaction(tx); // send tx to rpc

  /**
   * display some helper text
   */
  printConsoleSeparator();
  console.log("Transaction completed.");
  console.log(explorerURL({ txSignature: sig }));
  const testWalletCurrentBalance = await connection.getBalance(
    testWallet.publicKey
  );
  const payerCurrentBalance = await connection.getBalance(payer.publicKey);
  const staticWalletCurrentBalance = await connection.getBalance(
    STATIC_PUBLICKEY
  );

  return {
    txSignature: sig,
    newAccountKeyPair: testWallet,
    payerCurrentBalance,
    testWalletCurrentBalance,
    staticWalletCurrentBalance,
  };
}
