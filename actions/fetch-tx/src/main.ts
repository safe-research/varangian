// .github/actions/my-custom-action/src/main.ts
import * as core from '@actions/core';
import { SafeTransaction, ExtendedSafeTransaction, loadNextTxs, loadSafeInfo, loadChainId } from 'shared-utils';

const findToExecute = (txs: SafeTransaction[], version: string, chainId: number): ExtendedSafeTransaction | null => {
  const eligableTxs: SafeTransaction[] = []
  for (const tx of txs) {
    if (tx.confirmationsRequired <= tx.confirmations.length)
      eligableTxs.push(tx)
  }
  if (eligableTxs.length == 0) return null
  if (eligableTxs.length != 1) throw Error("Unexpected number of transactions")
  return {
    ...eligableTxs[0],
    data: eligableTxs[0].data || "0x",
    version,
    chainId
  }
}

const processFetchTx = async (serviceUrl: string, safeAddress: string): Promise<{ safeTx: ExtendedSafeTransaction | null }> => {
  core.info("Load Chain Id")
  const chainId = await loadChainId(serviceUrl);
  console.log({ chainId });
  core.info("Load Safe information")
  const safeInfo = await loadSafeInfo(serviceUrl, safeAddress);
  console.log({ safeInfo });
  core.info("Load current transactions")
  const nextTxs = await loadNextTxs(serviceUrl, safeInfo);
  console.log({ nextTxs });
  core.info("Find transactions that should be executed")
  const safeTx = findToExecute(nextTxs, safeInfo.version, chainId);
  return {
    safeTx
  }
}

async function run() {
  try {
    const serviceUrl = core.getInput('service-url', { required: true });
    const safeAddress = core.getInput('safe-address', { required: true });
    const output = await processFetchTx(serviceUrl, safeAddress)
    if (output.safeTx == null) {
      core.info("No eligable transactions")
      return
    }
    core.setOutput('safe-tx', JSON.stringify(output.safeTx));
  } catch (error: any) {
    // If an error occurs, set the action state to failed
    core.setFailed(error.message);
  }
}

// Call the run function to execute the action
run();