import jsonWebToken from 'jsonwebtoken'

// TODO: allow more configuration of these, particularly alg
const JWT_CLAIMS = {
  algorithms: [ 'HS512' ],
  expiresIn: '7d'
}

export const createJWT = (claims, secret) => {
  const { id, ...customClaims } = claims

  if (!id) {
    throw new Error('A user id is required for the JWT subject claim. Does your `getUser` function return an object with an `id` property?')
  }

  return jsonWebToken.sign(
    customClaims,
    secret,
    {
      ...JWT_CLAIMS,
      subject: id
    }
  )
}
