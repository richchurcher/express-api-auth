const sodium = require('libsodium-wrappers-sumo')

const generateArgon2id = async password => {
  await sodium.ready
  return sodium.crypto_pwhash_str(
    password,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE
  )
}

const generateScryptSalsa208SHA256 = async password => {
  await sodium.ready
  return sodium.crypto_pwhash_scryptsalsa208sha256_str(
    password,
    sodium.crypto_pwhash_scryptsalsa208sha256_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_scryptsalsa208sha256_MEMLIMIT_INTERACTIVE
  )
}

const hashingAlgorithm = ({ algorithm }) => algorithm === 'scrypt'
  ? generateScryptSalsa208SHA256
  : generateArgon2id

const generate = (password, options) => hashingAlgorithm(options)(password)

const verifyAlgorithm = hash => /^\$argon2/.test(hash)
  ? sodium.crypto_pwhash_str_verify
  : sodium.crypto_pwhash_scryptsalsa208sha256_str_verify

const verify = async (hash, password) => {
  await sodium.ready
  return verifyAlgorithm(hash)(hash, password)
}

module.exports = {
  generate,
  verify
}

