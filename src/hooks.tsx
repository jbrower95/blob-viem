import {createContext, useContext, useState} from "react";
import { PrivateKeyAccount, bytesToHex, hexToBytes } from "viem";
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts'
import { TPasskeyContext } from "./types";

const IS_AVAILABLE = navigator.credentials !== undefined
const DEFAULT_ID = new TextEncoder().encode("anonymous_user").buffer;
const EMPTY_CHALLENGE = new TextEncoder().encode("challenge").buffer;

const PasskeyContext = createContext<TPasskeyContext>({
    account: undefined,
    login: async () => {},
    register: async () => {},
    logout: () => {},
    reset: async () => {},
    isAvailable: IS_AVAILABLE
})

export const PasskeyContextProvider = ({children}: {children: JSX.Element}) => {
    const [account, setAccount] = useState<PrivateKeyAccount>();
    const [credentialId, setCredentialId] = useState<ArrayBuffer>();

    const fetchPrivateKeyUsingPasskey = async () => {
        const credential = await navigator.credentials.get({
            mediation: 'required',
            publicKey: {
                allowCredentials: undefined, /* any account */
                extensions: {
                    largeBlob: {
                        read: true
                    },
                },
                challenge: EMPTY_CHALLENGE, /* we do not care about the challenge */
                userVerification: 'preferred',
            }
        }) as PublicKeyCredential

        if (credential.getClientExtensionResults().largeBlob === undefined) {
            throw new Error("Unsupported Authenticator.")
        }

        if (!credential.getClientExtensionResults().largeBlob!.blob) {
            console.log(credential);
            console.log(credential.getClientExtensionResults());
            throw new Error("Invalid passkey.")
        }
        setCredentialId(credential.rawId);
        return bytesToHex(new Uint8Array(credential.getClientExtensionResults().largeBlob!.blob!))
    }

    const setPrivateKeyUsingPasskey = async (to: `0x${string}`) => {
        if (!credentialId) {
            throw new Error("Not logged in.");
        }

        const credential = await navigator.credentials.get({
            publicKey: {
                allowCredentials: [{
                    id: credentialId!,
                    type: "public-key",
                  }], /* any account */
                extensions: {
                    largeBlob: {
                        write: hexToBytes(to)
                    },
                },
                challenge: EMPTY_CHALLENGE, /* we do not care about the challenge */
                userVerification: 'preferred',
            }
        }) as PublicKeyCredential;

        if (!credential.getClientExtensionResults().largeBlob?.written) {
            console.log(credential.getClientExtensionResults());
            throw new Error("Failed to save account.");
        }

        setCredentialId(credential.rawId);
    }

    const login = async () => {
        const privateKey = await fetchPrivateKeyUsingPasskey();
        setAccount(privateKeyToAccount(privateKey));
    };

    const reset = async () => {
        const key = generatePrivateKey();
        setPrivateKeyUsingPasskey(key);
    }

    const register = async ({
        displayName = "anonymous_user",
        id = DEFAULT_ID,
        name = "anonymous_user",
        appName = "app"
    }) => {
        const credential = await navigator.credentials.create({
            publicKey: {
                extensions: {
                    largeBlob: {
                        support: 'required',
                    },
                },
                rp: {
                    name: appName
                },
                challenge: new TextEncoder().encode("test"),
                user: {
                    displayName,
                    id,
                    name
                },
                pubKeyCredParams: [
                    { alg: -8, type: 'public-key' },
                    { alg: -7, type: 'public-key' },
                    { alg: -257, type: 'public-key' }]
            },
        }) as PublicKeyCredential;
        setCredentialId(credential.rawId);
    };

    const logout = () => {
        setAccount(undefined);
    }

    return <PasskeyContext.Provider value={{
        account,
        login,
        logout,
        reset,
        register,
        isAvailable: IS_AVAILABLE
    }}>
        {children}
    </PasskeyContext.Provider>
}

export const usePasskey = () => {
    return useContext(PasskeyContext);
}
