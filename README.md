## Backend auth service

Node/Express backend for the indie tab site with:
- Email/password register + login
- Twitch OAuth
- Kick OAuth
- Forgot password + OTP email reset flow

### Run

```bash
npm install
cp .env.example .env
npm run dev
```

### Auth routes

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/twitch`
- `GET /auth/twitch/callback`
- `GET /auth/kick`
- `GET /auth/kick/callback`
