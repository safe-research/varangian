// .github/actions/my-custom-action/src/main.ts
import * as core from '@actions/core';
import { ethers } from 'ethers';
import { buildEthTransaction, EthTransaction, ExtendedSafeTransaction, loadChainInfo, relayEthTransaction } from 'shared-utils';

const processRelay = async (safeTx: ExtendedSafeTransaction, coSignerSig: string | null): Promise<string> => {
  core.info("Relay transaction")
  const transactionToRelay: EthTransaction = buildEthTransaction(safeTx, coSignerSig || "")
  console.log({ transactionToRelay })

  core.info("Simulate transaction")
  const chainInfo = await loadChainInfo(`${safeTx.chainId}`)
  const provider = new ethers.JsonRpcProvider(chainInfo.publicRpcUri.value)
  const simulationResult = await provider.call(transactionToRelay)
  console.log({ simulationResult })
  const success = ethers.AbiCoder.defaultAbiCoder().decode(["bool"], simulationResult)[0]
  if (!success) throw Error("Cannot relay Safe transaction")

  return relayEthTransaction(safeTx.chainId, transactionToRelay)
}

async function run() {
  try {
    const safeTx: ExtendedSafeTransaction = JSON.parse(core.getInput('safe-tx', { required: true }));
    const coSignerSig = core.getInput('co-signer-signature')
    const out = await processRelay(safeTx, coSignerSig)
    core.info(out)
  } catch (error: any) {
    // If an error occurs, set the action state to failed
    core.setFailed(error.message);
  }
}

// Call the run function to execute the action
run();