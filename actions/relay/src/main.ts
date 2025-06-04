// .github/actions/my-custom-action/src/main.ts
import * as core from '@actions/core';
import { EthTransaction, ExtendedSafeTransaction, buildEthTransaction } from 'shared-utils';

async function run() {
  try {
    const safeTx: ExtendedSafeTransaction = JSON.parse(core.getInput('safe-tx', { required: true }));
    const coSignerSig = core.getInput('co-signer-signature')

    core.info("Relay transaction")
    const transactionToRelay: EthTransaction = buildEthTransaction(safeTx, coSignerSig)
    console.log({ transactionToRelay })
    const resp = await fetch(`https://safe-client.safe.global/v1/chains/${safeTx.chainId}/relay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "1.0.0",
        ...transactionToRelay
      })
    })
    core.info(await resp.text())
  } catch (error: any) {
    // If an error occurs, set the action state to failed
    core.setFailed(error.message);
  }
}

// Call the run function to execute the action
run();