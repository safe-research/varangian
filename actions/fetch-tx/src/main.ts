// .github/actions/my-custom-action/src/main.ts
import * as core from '@actions/core';
import { SafeTransaction, EthTransaction, loadNextTxs, loadSafeInfo, buildEthTransaction } from 'shared-utils';

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
    console.log({ safeInfo });
    core.info("Load current transactions")
    const nextTxs = await loadNextTxs(serviceUrl, safeInfo);
    console.log({ nextTxs });
    core.info("Find transactions that should be executed")
    const txToExecute = findToExecute(nextTxs)
    if (txToExecute == null) {
      core.info("No eligable transactions")
      return
    }
    core.setOutput('safe-tx', JSON.stringify(txToExecute));
  } catch (error: any) {
    // If an error occurs, set the action state to failed
    core.setFailed(error.message);
  }
}

// Call the run function to execute the action
run();