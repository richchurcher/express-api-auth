# express-api-auth

This is a JWT authentication strategy for Express APIs, intended to help secure SPAs. By default, it:

* sets the JWT in a cookie with secure, same-site, and HTTP-only flags
* sets an XSRF-TOKEN cookie (no flags), making it compatible with Angular's CSRF prevention
* expires and refreshes the JWT at 15 minute intervals
* allows any user claims to be included with the token

The strategy makes use of [csurf]() and Auth0's [express-jwt]().

This package does not encrypt the token. Don't place any sensitive information in the token.

## Installation

`cookie-parser` (or anything else that places cookie values on `req.cookies`) is required.

```
npm install cookie-parser express-api-auth
```

## Basic use

To protect an Express route:

```js
const express = require('express')
const cookieParser = require('cookie-parser')
const auth = require('express-api-auth')

const { getUser } = require('./users')

const app = express()
const protect = auth.protect({
  secret: process.env.JWT_SECRET
})

app.use(cookieParser())

app.post('/login', auth.login({ getUser })
app.get('/logout', auth.logout)
app.post('/api/users', protect, (req, res) => {
  // ...
})

app.use(auth.errorHandler)
```

Here, `getUser` is a function that accepts a username argument and returns a user object containing only those properties intended to be included with the JWT (if it returns a promise, it will be `await`ed) and a hash, by default in the `hash` property. So a simple implementation might return:

```js
{
  id: '1',
  hash: '$argon2id$v=19$m=65536,t=2,p=1$PCnOK9p30lFPLk...'
}
```

If the promise rejects (or a `null` is returned), `login` will issue an error.

If it resolves successfully, two cookies will be set: one containing the JWT named `SESSION`, and one containing a CSRF token named `XSRF-TOKEN`. A 201 HTTP status response will be issued. The JWT will contain a `sub` (subject) claim consisting of the user id, available on the request object as `req.user.sub`.

Note that `login` is not designed to return a more complete user object. If you need a user object, one reasonable approach would be to include the user id in the JWT and expose a `currentuser` route which responds with a 'rehydrated' user based on the value of `req.user.sub`.

## Error handling

The provided `errorHandler` looks for:

* `UnauthorizedError` (issued by `express-jwt`)
* `EBADCSRFTOKEN` (issued by `csurf`)
* `AuthenticationError` (issued by this package)

If it finds any of these, it issues suitable JSON responses and status codes. If it doesn't, it passes the error along via `next(err)` so you can deal with it in another handler. You can of course choose to do your own auth error handling by skipping the use of `errorHandler` entirely.

