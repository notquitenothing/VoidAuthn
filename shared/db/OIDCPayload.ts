export type OIDCPayload = {
  id: string
  type: string
  payload: string
  grantId?: string | null
  userCode?: string | null
  uid?: string | null
  expiresAt?: Date | null
  consumedAt?: Date | null
}

export type PayloadType = 'Session'
  | 'AccessToken'
  | 'AuthorizationCode'
  | 'RefreshToken'
  | 'DeviceCode'
  | 'ClientCredentials'
  | 'Client'
  | 'InitialAccessToken'
  | 'RegistrationAccessToken'
  | 'Interaction'
  | 'ReplayDetection'
  | 'PushedAuthorizationRequest'
  | 'Grant'
  | 'BackchannelAuthenticationRequest'
