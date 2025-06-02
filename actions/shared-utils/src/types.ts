export interface SafeInfo {
    address: string;
    nonce: number;
    threshold: number;
    owners: string[];
    modules: string[];
    guard: string;
    masterCopy: string;
    fallbackHandler: string;
    version: string;
}

export interface SafeTransaction {
    safe: string;
    to: string;
    value: string;
    data: string;
    operation: number;
    nonce: number;
    safeTxGas: string;
    baseGas: string;
    gasPrice: string;
    gasToken: string;
    refundReceiver: string;
    confirmations: SafeSignature[];
    confirmationsRequired: number;
}

export interface SafeSignature {
    owner: string;
    signature: string;
    signatureType: string;
}

export interface EthTransaction {
    to: string;
    data: string;
}