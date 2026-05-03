import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { register, login, forgotPassword, verifyOtpAndReset } from './auth.js';
import { setupPassport, oauthSuccess } from './oauth.js';

const app = express();
app.use(cors());
app.use(express.json());

setupPassport();
app.use(passport.initialize());

app.get('/health', (_, res) => res.json({ ok: true }));

app.post('/auth/register', register);
app.post('/auth/login', login);
app.post('/auth/forgot-password', forgotPassword);
app.post('/auth/reset-password', verifyOtpAndReset);

app.get('/auth/twitch', passport.authenticate('twitch'));
app.get('/auth/twitch/callback', passport.authenticate('twitch', { session: false }), oauthSuccess);

app.get('/auth/kick', passport.authenticate('kick'));
app.get('/auth/kick/callback', passport.authenticate('kick', { session: false }), oauthSuccess);

app.listen(Number(process.env.PORT || 4000), () => {
  console.log(`Auth backend running on :${process.env.PORT || 4000}`);
});
