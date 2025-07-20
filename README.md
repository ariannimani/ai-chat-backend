<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Overview

NestJS-Chat-App is a robust and scalable real-time chat application designed to provide a seamless communication experience. Leveraging the power of [NestJS](https://nestjs.com/) for server-side logic, [PostgreSQL](https://www.postgresql.org/) with [TypeORM](https://typeorm.io/) for efficient data storage and ORM, [Supabase](https://supabase.com/) for real-time features and storage, and WebSockets for instantaneous bi-directional communication, this application offers a feature-rich environment for users to engage in peer-to-peer conversations and participate in room-based discussions.

## Features

- **User Authentication:** Secure user authentication using [Passport](http://www.passportjs.org/) and [JWT](https://jwt.io/), with optional [Supabase Auth](https://supabase.com/auth) integration.
- **Peer-to-Peer Messaging:** Enjoy direct and private conversations with other users in real-time.
- **Room-Based Conversations:** Join or create chat rooms to engage in group discussions on various topics.
- **Real-time Features:** Enhanced real-time communication using Supabase channels and WebSockets for instant message delivery.
- **File Uploads:** Share files and media in chat rooms using Supabase Storage with automatic CDN delivery.
- **WebSockets Integration:** Harness the power of WebSockets for low-latency communication, providing a responsive and dynamic chat experience.
- **TypeORM:** Benefit from the powerful [TypeORM](https://typeorm.io/) for PostgreSQL, providing type-safe database operations and migrations.
- **Supabase Integration:** Leverage [Supabase](https://supabase.com/) for real-time subscriptions, file storage, and optional authentication.
- **NestJS Command Seeding:** Utilize [NestJS Command](https://docs.nestjs.com/cli/commands) for convenient seeding of initial data.

## Technologies Used

- [NestJS](https://nestjs.com/): A progressive Node.js framework for building efficient and scalable server-side applications.
- [PostgreSQL](https://www.postgresql.org/): A powerful, open-source relational database system with advanced features.
- [Supabase](https://supabase.com/): Open-source Firebase alternative providing PostgreSQL database, real-time subscriptions, storage, and authentication.
- [TypeORM](https://typeorm.io/): TypeScript ORM for Node.js with support for TypeScript and JavaScript.
- [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API): Facilitates real-time, bidirectional communication between clients and servers.
- [Socket.IO](https://socket.io/): A library for real-time web applications, enabling real-time, bi-directional communication.
- [Passport](http://www.passportjs.org/): Simple, unobtrusive authentication for Node.js.
- [JWT](https://jwt.io/): JSON Web Tokens for secure authentication.
- [NestJS Command](https://docs.nestjs.com/cli/commands): Convenient command-line tools for NestJS applications.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Contributing

We welcome contributions! If you have ideas for new features, find bugs, or want to improve the documentation, feel free to open issues and pull requests.
