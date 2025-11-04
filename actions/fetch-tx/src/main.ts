// .github/actions/my-custom-action/src/main.ts
import * as core from '@actions/core';
import { ExtendedSafeTransaction, loadNextTxs, loadSafeInfo, loadChainId } from 'shared-utils';
import { findToExecute } from './utils';

const processFetchTx = async (serviceUrl: string, safeAddress: string, safeTxHash?: string): Promise<{ safeTx: ExtendedSafeTransaction | null }> => {
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
  const safeTx = findToExecute(nextTxs, safeInfo.version, chainId, safeTxHash);
  return {
    safeTx
  }
}

async function run() {
  try {
    const serviceUrl = core.getInput('service-url', { required: true });
    const safeAddress = core.getInput('safe-address', { required: true });
    const safeTxHash = core.getInput('safe-tx-hash');
    const output = await processFetchTx(serviceUrl, safeAddress, safeTxHash)
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