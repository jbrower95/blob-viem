import { TransactionSerializable } from "viem";

/**
 * hot:
 *  - future signatures do not require a passkey prompt. (only an 'ok')
 * prompt:
 *  - key is never held session storage, only in memory. 
 *   if you delete a passkey, you may lose your session.
 */
export type SessionType = "hot" | "prompt";

export type BaseResponse = {
    success: boolean
    error?: string
    sessionId?: string
}

export type BaseRequest = {
    type: 'get' | 'register' | 'login' | 'logout' | 'sign' | 'export'
}

export type BaseAuthedRequest = {
    sessionId: string
}

export type Method<TRequest extends BaseRequest, TResponse extends BaseResponse> = {
    Request: TRequest
    Response: TResponse
}

type CredentialsResponse = {
    // a unique identifier for this login
    credentialId: string,

    // address, for UI display etc.
    address: `0x${string}`
}


/**
 * Check whether a session is active for the given session id.
 * 
 * If it exists, returns the credentials for the session.
 */
export type SessionGet = {
    Request: BaseAuthedRequest & {
        type: 'get'
    },
    Response: BaseResponse & CredentialsResponse & {}
}

/**
 * Registers a new wallet, and logs in.
 * 
 * - If a session currently exists, this logs it out.
 */
export type Register = {
    Request: {
        type: 'register'
        sessionType: SessionType
    },
    Response: BaseResponse & CredentialsResponse & {}
}

/**
 * Logs into an existing wallet. 
 * 
 * - If a session currently exists, this logs it out.
 */
export type Login = {
    Request: {
        type: 'login'
        sessionType: SessionType
        requestedCredentialId?: string
    }
    Response: BaseResponse & CredentialsResponse & {}
}

export type Logout = {
    Request: BaseRequest & BaseAuthedRequest & {
        type: 'logout'
    }
    Response: BaseResponse & {}
}

export type SignTransaction = {
    Request: BaseRequest & BaseAuthedRequest & {
        type: 'sign'
        /**
         * Sign this transaction.
         */
        transaction: TransactionSerializable
    }

    Response: BaseResponse & {
        /**
         * Ready-to-submit signature.
         */
        signature: `0x${string}`
    }
}

export type ExportKey = {
    Request: BaseRequest & BaseAuthedRequest & {
        type: 'export'
    }

    Response: BaseResponse & {
        privateKey: `0x${string}`
    }
}