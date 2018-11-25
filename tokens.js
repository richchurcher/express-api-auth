import jsonWebToken from 'jsonwebtoken'

export const createJWT = (claims, secret) => {
  const { id, ...customClaims } = claims

  if (!id) {
    throw new Error('A user id is required for the JWT subject claim. Does your `getUser` function return an object with an `id` property?')
  }

  return jsonWebToken.sign(
    customClaims,
    secret,
    {
      expiresIn: '15m',
      subject: id
    }
  )
}
