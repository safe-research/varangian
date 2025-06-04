// .github/actions/my-custom-action/src/main.ts
import * as core from '@actions/core';
import { ethers } from 'ethers';
import { ExtendedSafeTransaction, getSafeTxHash } from 'shared-utils';

const getCoSigner = (coSignerMaterial: string): ethers.Wallet => {
  const wallet = new ethers.Wallet(ethers.keccak256(ethers.toUtf8Bytes(coSignerMaterial)))
  core.info(`Co-signer address: ${wallet.address}`)
  return wallet
}

const checkTransaction = async (coSignerMaterial: string, safeTx: ExtendedSafeTransaction): Promise<{ coSignerSignature: string }> => {
  const wallet = getCoSigner(coSignerMaterial)

  const safeTxHash = getSafeTxHash(safeTx)

  core.info("Check Safe transaction hash")
  if (safeTxHash != safeTx.safeTxHash) throw Error(`Unexpected Safe transaction hash ${safeTxHash}, expected ${safeTx.safeTxHash}`)

  core.info("Check if transaction passed all checks")
  if (safeTx.operation != 0 && safeTx.to != "0x9641d764fc13c8B624c04430C7356C1C7C8102e2") {
    throw Error("Unexpected delegatecall")
  }
  core.info("Generate co-signer signature")
  const coSignerSignature: string = wallet.signingKey.sign(safeTxHash).serialized
  console.log({ coSignerSignature });
  return { coSignerSignature }
}

async function run() {
  try {
    const coSignerMaterial = core.getInput('co-signer-material', { required: true });
    const encodedSafeTx = core.getInput('safe-tx')
    if (!encodedSafeTx) {
      getCoSigner(coSignerMaterial)
      return
    }
    const safeTx: ExtendedSafeTransaction = JSON.parse(encodedSafeTx);
    const output = await checkTransaction(coSignerMaterial, safeTx)
    core.setOutput('co-signer-signature', output.coSignerSignature);
    /*
    */
  } catch (error: any) {
    // If an error occurs, set the action state to failed
    core.setFailed(error.message);
  }
}

// Call the run function to execute the action
run();