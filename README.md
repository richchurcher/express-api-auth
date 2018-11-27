# express-api-auth

**THIS IS PRE-ALPHA. DEFINITELY NOT READY FOR PRODUCTION USE.**

This is a JWT authentication strategy for Express APIs, intended to help secure SPAs. By default, it:

* sets the JWT in a cookie with secure, same-site, and HTTP-only flags
* sets an XSRF-TOKEN cookie (no flags), making it compatible with Angular's CSRF prevention
* uses a long expiry access token, but refreshes it frequently when the user is active
* allows any user claims to be included with the token

The strategy makes use of [csurf]() and Auth0's [express-jwt]().

This package does not encrypt the token. Don't place any sensitive information in the token.

## Installation

`cookie-parser` (or anything else that places cookie values on `req.cookies`) is required.

```
npm install cookie-parser express-api-auth
```

## Basic use

To add authentication to an Express route:

```js
const express = require('express')
const cookieParser = require('cookie-parser')
const auth = require('express-api-auth')

const { getUser } = require('./users')

const app = express()
const login = auth.login({ getuser, secret: process.env.JWT_SECRET })
const identify = auth.identify({ secret: process.env.JWT_SECRET })

app.use(cookieParser())

app.post('/login', login)
app.get('/logout', auth.logout)
app.post('/api/users', identify, (req, res) => {
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

If the promise rejects, `login` will issue an error.

If it resolves (and the hash is verified) two cookies will be set: one containing the JWT named `ACCESS-TOKEN`, and one containing a CSRF token named `XSRF-TOKEN`. A 201 HTTP status response will be issued. The JWT will contain a `sub` (subject) claim consisting of the user id, available on the request object as `req.user.sub`.

Note that `login` is not designed to return a more complete user object. If you need a user object, one reasonable approach would be to expose a `currentuser` route which responds with a 'rehydrated' user based on the value of `req.user.sub`.

## Logout

`logout` will send a response, so if you need to take care of anything else prior to logout, best to add more middleware to the stack before it:

```js
app.get('/logout', doWhatever, auth.logout)
```

You'll need to insert an `express-jwt` call prior to that if you require a user id.

## Validation

`login` will check for the _presence_ of `username` and `password` on `req.body`, but it won't do much else. If you have specific validation requirements on those fields, you should add some earlier middleware to take care of it:

```js
app.post('/login', validateCredentials, auth.login({ ... }))
```

It is assumed that whatever storage layer you use for `getUser` protects you sufficiently against SQL injection: this is not checked for in `login`.

## Post-login hook

It's not uncommon to need to update a few values, do something funky with sockets or write to logs following a successful login. Provide the name of a function as the `postLogin` config property to accomplish this. It can (but does not have to) return a promise:

```js
app.post('/login', auth.login({ postLogin: updateCounters }))
```

It will be called with both request and response objects (but not `next`). Whatever user object is returned by `getUser` will therefore be available as `res.locals.expressAPIAuth.user`.

## Post-identify hook

Similar to `postLogin`, but called after `identify` and passed both request and response. The contents of the access token JWT will be available as `req.user`. The function can return a promise.

```js
app.get('/users', auth.identify({ secret, postIdentify: rehydrateUser }))
```

## Signing and choice of secret

JWTs signed with relatively short secrets [can be brute-forced](https://auth0.com/blog/brute-forcing-hs256-is-possible-the-importance-of-using-strong-keys-to-sign-jwts/). To mitigate this risk, choose a secret the same size as the hash output. The default is currently HS512, so choose a 512-bit key. If we're talking 8 bit characters, that's a 64 byte string. Using *nix, such a string could be generated with:

```sh
LC_ALL=C tr -dc '[[:alnum:][:punct:]]' < /dev/urandom | head -c 64
```

## Errors

The provided `errorHandler` looks for:

* `UnauthorizedError` (issued by `express-jwt`)
* `EBADCSRFTOKEN` (issued by `csurf`)
* `AuthenticationError` (issued by this package)

If it finds any of these, it issues suitable JSON responses and status codes. If it doesn't, it passes the error along via `next(err)` so you can deal with it in another handler. You can of course choose to do your own auth error handling by skipping the use of `errorHandler` entirely.

