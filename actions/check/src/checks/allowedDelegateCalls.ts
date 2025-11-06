import { getAddress } from "ethers";
import { ExtendedSafeTransaction } from "shared-utils";

const allowedDelegatecallTargets = [
    "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D", // Multisend Call Only 1.3.0
    "0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B", // Multisend Call Only 1.3.0 - eip155
    "0x9641d764fc13c8B624c04430C7356C1C7C8102e2", // Multisend Call Only 1.4.1
    "0xA83c336B20401Af773B6219BA5027174338D1836", // Multisend Call Only 1.5.0
    "0x526643F69b81B008F46d95CD5ced5eC0edFFDaC6", // Safe Migration 1.4.1
    "0x6439e7ABD8Bb915A5263094784C5CF561c4172AC", // Safe Migration 1.5.0
    "0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2", // Sign Message Lib 1.3.0
    "0x98FFBBF51bb33A056B08ddf711f289936AafF717", // Sign Message Lib 1.3.0 - eip155
    "0xd53cd0aB83D845Ac265BE939c57F53AD838012c9", // Sign Message Lib 1.4.1
    "0x4FfeF8222648872B3dE295Ba1e49110E61f5b5aa", // Sign Message Lib 1.5.0
]

export const allowedDelegateCalls = (safeTx: ExtendedSafeTransaction) => {
    console.info("Check allowed deleatecalls!")
    if (safeTx.operation == 0) {
        // Calls are allowed
        return
    }
    if (safeTx.operation != 1) {
        throw Error("Unexpected operation")
    }
    const checksummedTo = getAddress(safeTx.to)
    if (allowedDelegatecallTargets.includes(checksummedTo)) {
        // Delegatecalls to allow listed targets are allowed 
        return
    }
    throw Error("Unexpected delegatecall")
}