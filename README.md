# 🔗 EcoFind Backend

EcoFind Backend is the API and core service powering the EcoFind sustainable marketplace platform.  
Built with **Node.js**, **TypeScript**, **Express**, and **Prisma**, it provides a scalable, secure, and developer-friendly backend environment.

***

## 🚀 Features

- 🌱 **RESTful API** built on Express
- 🗄️ **Prisma ORM** – type-safe migration and DB modeling
- 👤 **Authentication & Authorization** (JWT)
- 🔑 **Password Hashing** using bcrypt
- 🌍 **Environment Configuration** using dotenv
- 📜 **Structured Logging** with pino + pino-pretty
- 🔗 **CORS** support for frontend-backend integration
- 📦 **Modular Design** for clean controllers & routes

***

## 🛠️ Tech Stack

- **Node.js** (runtime)
- **Express.js** (API server)
- **TypeScript** (type safety)
- **Prisma** (ORM for DB management)
- **PostgreSQL** or compatible DB
- **bcrypt**, **jsonwebtoken** (security)
- **dotenv**, **CORS**, **pino** (utilities)

***

## 📂 Project Structure

```
.
├── db/             # Database setup, helpers
├── prisma/         # Prisma schema, migrations
├── routes/         # Express route handlers/modules
├── src/            # Controllers, middleware, utils
├── server.js       # (Entry point)
├── package.json
├── tsconfig.json
├── .env.example    # Template for env variables
```

***

## ⚙️ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/its-abhijeet/projbackend.git
cd projbackend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy `.env.example` to `.env` and set values for your DB, port, JWT secret, etc:
```
DATABASE_URL=your_db_url
JWT_SECRET=your_jwt_secret
PORT=4000
```

### 4. Run Prisma migrations & generate client
```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Build & start the server
#### Development:
```bash
npm run build
npm run dev
```
#### Production:
```bash
npm run build
npm start
```

***

## 🧪 Scripts

- `npm run build` – TypeScript build
- `npm run dev` – Build + run (development)
- `npm start` – Run production server
- `npm run test` – Placeholder for tests

***

## 🌐 API Overview

Standard REST endpoints for:
- Auth: `/api/auth/*`
- Users: `/api/users/*`
- Listings/Products: `/api/products/*`
- KYC/Admin: `/api/kyc/*`, `/api/admin/*`

See code and controller docs for full details.

***

## 🤝 Contributing

Contributions are welcome!  
- Fork & branch
- Commit with clear messages
- Open a PR for review

***

## 🐞 Issues

Found a bug or want a feature? [Open an issue](https://github.com/its-abhijeet/projbackend/issues)

***

## 📜 License

This project is licensed under the **ISC License**.

***

## 🌱 About EcoFind

EcoFind aims to power a circular, sustainable marketplace for a greener tomorrow.  
Help build the engine for environmental good! ♻️

***

[1](https://github.com/rahil1202/backend-express-prisma-typescript-template)
[2](https://github.com/prisma/prisma)
[3](https://www.prisma.io/orm)
[4](https://www.reddit.com/r/node/comments/r0eq8k/productionready_template_for_backends_created/)
[5](https://www.prisma.io/blog/nestjs-prisma-rest-api-7D056s1BmOL0)
[6](https://blog.logrocket.com/creating-a-node-js-graphql-server-using-prisma-2/)
[7](https://www.npmjs.com/package/prisma)
[8](https://sourcegraph.com/github.com/prisma/prisma-examples)
