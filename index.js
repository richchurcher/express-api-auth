const hash = require('./hash')
const login = require('./login')

function logout () {}

function identify () {}

function restrict (roles) {}

module.exports = {
  identify,
  restrict,
  login,
  logout,
  hash
}

