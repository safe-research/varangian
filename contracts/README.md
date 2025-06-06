# Varangian Guard Contracts

This package contains the smart contracts used by the Varangian project, including:

## Deployed Addresses

Deterministic deployment: `0xeEa957669eEe31aE47F294b346d1971c76318c5E`

Currently deployed on:
- Gnosis Chain

## Architecture

### Safenet Guard
- Fully audited contract
- Allows to have a co-signer that "approves" transactions to be executed
- Can be permissionlesly deactivated within a time delay

### Safenet Guard Factory
- Simplify deployment of Safenet Guard

## Verify Contracts

### Safenet Guard Factory

```bash
source .env
forge verify-contract <factory_address> src/SafenetGuardFactory.sol:SafenetGuardFactory \
    --num-of-optimizations 1000000 \
    --watch \
    --verifier etherscan \
    --verifier-url https://api.gnosisscan.io/api \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    --chain gnosis \
    --compiler-version v0.8.28 \
    -vvvv
```

### Safenet Guard

```bash
source .env
forge verify-contract <guard_address> lib/safenet/contracts/src/SafenetGuard.sol:SafenetGuard \
    --num-of-optimizations 1000000 \
    --watch \
    --verifier etherscan \
    --verifier-url https://api.gnosisscan.io/api \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    --chain gnosis \
    --constructor-args $(cast abi-encode "constructor(address,uint256)" <safe_address> 604800) \
    --compiler-version v0.8.28 \
    -vvvv
```