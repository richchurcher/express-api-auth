const csrf = require('csurf')
const { isFunction } = require('lodash')

const AuthenticationError = require('./authentication-error.js')
const tokens = require('./tokens')
const { verify } = require('./hash')

const ACCESS_TOKEN_FLAGS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: true
}

const validate = (req, res, next) => {
  const { username, password } = res.locals.expressAPIAuth

  if (!username) {
    return next(new AuthenticationError('Missing username.', 401))
  }

  if (!password) {
    return next(new AuthenticationError('Missing password.', 401))
  }

  next()
}

const authenticate = async (req, res, next) => {
  const { credentials, getUser, hashField } = res.locals.expressAPIAuth

  let userWithHash = null
  if (!isFunction(getUser)) {
    throw new Error('`getUser` must be a function. Did you include it in the options object?')
  }

  try {
    userWithHash = await getUser(credentials.username)
  } catch (e) {
    return next(new AuthenticationError('Unknown user.', 401))
  }

  if (!await verify(userWithHash[hashField], credentials.password)) {
    return next(new AuthenticationError('Invalid password.', 401))
  }

  const { hash, ...user } = userWithHash
  res.locals.expressAPIAuth.user = user
  next()
}

const postLoginHook = async (req, res, next) => {
  const { loginHook } = res.locals.expressAPIAuth

  // TODO: ideally allow an array of middleware here
  if (!isFunction(loginHook)) {
    return next()
  }

  await loginHook(req, res)
  next()
}

const issueTokens = (req, res) => {
  const { user, secret } = res.locals.expressAPIAuth
  const accessToken = tokens.createJWT(user, secret)
  const csrfToken = req.csrfToken()
  res.cookie('ACCESS-TOKEN', accessToken, ACCESS_TOKEN_FLAGS)
  res.cookie('XSRF-TOKEN', csrfToken)
  res.sendStatus(201)
}

const login = options => [
  csrf({ ignoreMethods: [ 'POST' ] }),
  async (req, res, next) => {
    const { username, password } = req.body

    res.locals.expressAPIAuth = {
      credentials: {
        username,
        password
      },
      ...options
    }

    next()
  },
  validate,
  authenticate,
  postLoginHook,
  issueTokens
]

module.exports = login

