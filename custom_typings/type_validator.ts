import assert from 'assert'
import add from 'oidc-provider/lib/helpers/add_client'
import initialize from 'oidc-provider/lib/helpers/initialize_keystore'

assert.ok(initialize, 'oidc-provider/lib/helpers/initialize_keystore [initialize] does not exist.')
assert.ok(add, 'oidc-provider/lib/helpers/add_client [add] does not exist.')
