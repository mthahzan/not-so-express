# @npmthahzan@npmthahzan/not-so-express

My own (quite shitty) version of Express.js

## Getting started

```bash
# NPM
npm i --save @npmthahzan/not-so-express

# Yarn
yarn add @npmthahzan/not-so-express
```

### Setup the server

```typescript
import { Server } from '@npmthahzan/not-so-express';

// Create the server
const server = new Server({
  host: "localhost",
  port: 4221,
  notFoundHandler: ({ request, response }) => {
    response.notFound({ message: `No route found for ${request.method} ${request.path}` });
  },
});

// Create the route(s)
const route = server.route({ method: 'GET', path: '/' });
route.handler(async ({ response }) => {
  response.ok({ message: 'Hello world!' });
});

// Start listening for requests
server.listen();
```
