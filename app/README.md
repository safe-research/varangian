# Varangian Guard Safe App

Simple React based Safe App that builds the transactions to deploy and configure the Safenet Guard used with the Varangian Guard co-signer.

## Transactions

The Safe App builds the transaction batch for the following steps:

- Deploy the Safenet Guard via the Safenet Guard Factory
- Enable the deployed guard on the currently active Safe
- Configure the Co-Signer on the Safenet Guard for the active Safe

## Development

* Install dependencies

```sh
npm i
```

* Run local instance

```sh
npm run dev
```

## Deployment

The Safe App is hosted via GitHub pages. It will be automatically deployed when pushing updates to the `app-releases` branch. For this [create a PR](https://github.com/safe-research/varangian/compare/app-release...main?expand=1) to merge the changes from `main`.

## Configuration details

### CORS

Vite is configured to allow CORS. This is required to use the local instance as a Safe App