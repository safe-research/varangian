// .github/actions/my-custom-action/src/main.ts
import * as core from '@actions/core';
import { ethers } from 'ethers';
import { ExtendedSafeTransaction, getSafeTxHash } from 'shared-utils';
import { runChecks } from './checks';

const getCoSigner = (coSignerMaterial: string): ethers.Wallet => {
  const wallet = new ethers.Wallet(ethers.keccak256(ethers.toUtf8Bytes(coSignerMaterial)))
  core.info(`Co-signer address: ${wallet.address}`)
  return wallet
}

const checkTransaction = async (coSignerMaterial: string, safeTx: ExtendedSafeTransaction, coSignerSig1271Compatible: boolean): Promise<{ coSignerSignature: string, coSignerAddress: string }> => {
  const wallet = getCoSigner(coSignerMaterial)

  const safeTxHash = getSafeTxHash(safeTx)

  core.info("Check Safe transaction hash")
  if (safeTxHash != safeTx.safeTxHash) throw Error(`Unexpected Safe transaction hash ${safeTxHash}, expected ${safeTx.safeTxHash}`)

  core.info("Check if transaction passed all checks")
  runChecks(safeTx)

  core.info("Generate co-signer signature")
  const coSignerSignature: string = wallet.signingKey.sign(safeTxHash).serialized
  if (coSignerSig1271Compatible) {
    // The signature length is appended as a 32 byte word to the end of the signature. And the signature length in this case is always 65 bytes (0x41).
    const signatureLength = ethers.zeroPadValue("0x41", 32);
    console.log({ signatureLength });
    console.log({ coSignerSignature });
    return { coSignerSignature: coSignerSignature + signatureLength.slice(2), coSignerAddress: wallet.address }
  }
  console.log({ coSignerSignature });
  return { coSignerSignature, coSignerAddress: wallet.address }
}

async function run() {
  try {
    const coSignerMaterial = core.getInput('co-signer-material', { required: true });
    const coSignerSig1271Compatible = core.getBooleanInput('signature-1271-compatible') ?? false;
    const encodedSafeTx = core.getInput('safe-tx')
    if (!encodedSafeTx) {
      // If there is no transaction to check, then we only return the co-signer address
      const wallet = getCoSigner(coSignerMaterial)
      core.setOutput('co-signer-address', wallet.address);
      return
    }
    const safeTx: ExtendedSafeTransaction = JSON.parse(encodedSafeTx);
    const output = await checkTransaction(coSignerMaterial, safeTx, coSignerSig1271Compatible);
    core.setOutput('co-signer-address', output.coSignerAddress);
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