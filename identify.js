const verifyJwt = require('express-jwt')
const { isFunction } = require('lodash')

const identify = ({ postIdentify, secret }) => [
  verifyJwt({ secret }),
  async (req, res, next) => {
    if (!isFunction(postIdentify)) {
      await postIdentify(req.user)
    }

    next()
  }
]

module.exports = identify
