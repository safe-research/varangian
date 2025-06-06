# Varangian Guard Safe App

Simple React based Safe App that builds the transactions to deploy and configure the Safenet Guard used with the Varangian Guard co-signer.

## Transactions

The Safe App builds the transaction batch for the following steps:

- Deploy the Safenet Guard via the Safenet Guard Factory
- Enable the deployed guard on the currently active Safe
- Configure the Co-Signer on the Safenet Guard for the active Safe

## Setup

* Install dependencies

```sh
npm i
```

* Run local instance

```sh
npm run dev
```

## Configuration details

### CORS

Vite is configured to allow CORS. This is required to use the local instance as a Safe App