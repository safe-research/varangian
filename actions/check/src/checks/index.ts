import { ExtendedSafeTransaction } from "shared-utils"
import { allowedDelegateCalls } from "./allowedDelegateCalls"

type Check = (safeTx: ExtendedSafeTransaction) => void

const defaultChecks: Check[] = [
    allowedDelegateCalls
]

export const runChecks = (safeTx: ExtendedSafeTransaction, checks: Check[] = defaultChecks) => {
    for (const check of checks) {
        check(safeTx)
    }
}