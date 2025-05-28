// .github/actions/my-custom-action/src/main.ts
import * as core from '@actions/core';
import { buildEthTransaction, loadNextTxs, loadSafeInfo } from './safe';
import { EthTransaction, SafeTransaction } from './types';

const findToExecute = (txs: SafeTransaction[]): SafeTransaction | null => {
    const eligableTxs: SafeTransaction[] = []
    for (const tx of txs) {
        if (tx.confirmationsRequired <= tx.confirmations.length)
            eligableTxs.push(tx)
    }
    if (eligableTxs.length == 0) return null
    if (eligableTxs.length != 1) throw Error("Unexpected number of transactions")
    return eligableTxs[0]
}

async function run() {
  try {
    const serviceUrl = core.getInput('service-url', { required: true });
    const safeAddress = core.getInput('safe-address', { required: true });
    core.info("Load Safe information")
    const safeInfo = await loadSafeInfo(serviceUrl, safeAddress);
    console.log({safeInfo});
    core.info("Load current transactions")
    const nextTxs = await loadNextTxs(serviceUrl, safeInfo);
    console.log({nextTxs});
    core.info("Find transactions that should be executed")
    const txToExecute = findToExecute(nextTxs)
    if (txToExecute == null) {
        core.info("No eligable transactions")
        return
    }
    core.info("Check if transaction passed all checks")
    if (txToExecute.operation != 0 && txToExecute.to != "0x9641d764fc13c8B624c04430C7356C1C7C8102e2") {
        throw Error("Unexpected delegatecall")
    }
    core.info("(skip) Generate co-signer signature")
    const coSignerSig: string = ""

    core.info("Relay transaction")
    const transactionToRelay: EthTransaction = buildEthTransaction(txToExecute, coSignerSig)
    const resp = await fetch("https://safe-client.safe.global/v1/chains/100/relay", {
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