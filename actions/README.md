# Varangian Guard Actions

Collection of GitHub Actions used to co-sign transactions.

## Actions

- [Fetch Transactions](./fetch-tx/)

  Action to fetch the next Safe transaction that should be handled from the Safe transaction service

- [Check Transaction](./check/)

  Action to check and co-sign the specified Safe transaction

- [Relay Transaction](./relay/)

  Action to relay a Safe transaction that has been approved

## Setup

To setup the GitHub actions for yourself it is recommended to use the [Varangian Guard Template](https://github.com/safe-research/varangian-template)

## Development

The actions are setup as a monorepo. Each action is maintained in a separate folder. The `shared-utils` folder contains all shared logic.

- Install dependencies

```sh
npm i
```

- Build all packages

```sh
npm run build:all
```

### Cosigner Signature Encoding

There are two modes of signature encoding done, one which contains only the signature and the other which also contains the length of the signature.

#### Default Mode

This is the mode where only signature is present based on the cosigner address derived.

#### 1271 Compatible Mode

This is the mode where the signature and the length, both are appended at the end of the signature of a Safe Tx
