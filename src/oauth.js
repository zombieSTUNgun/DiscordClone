import passport from 'passport';
import { Strategy as TwitchStrategy } from 'passport-twitch-new';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import db from './db.js';
import { signToken } from './auth.js';

function upsertSocialUser(provider, providerId, email, displayName) {
  let user = db.prepare('SELECT * FROM users WHERE provider = ? AND provider_id = ?').get(provider, providerId);
  if (!user && email) {
    user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (user) {
      db.prepare('UPDATE users SET provider = ?, provider_id = ? WHERE id = ?').run(provider, providerId, user.id);
    }
  }

  if (!user) {
    const result = db
      .prepare('INSERT INTO users (email, display_name, provider, provider_id, verified) VALUES (?, ?, ?, ?, 1)')
      .run(email || null, displayName || null, provider, providerId);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  }

  return db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
}

export function setupPassport() {
  if (process.env.TWITCH_CLIENT_ID) {
    passport.use(
      new TwitchStrategy(
        {
          clientID: process.env.TWITCH_CLIENT_ID,
          clientSecret: process.env.TWITCH_CLIENT_SECRET,
          callbackURL: process.env.TWITCH_CALLBACK_URL,
          scope: 'user:read:email'
        },
        (accessToken, refreshToken, profile, done) => {
          const email = profile?.email;
          const user = upsertSocialUser('twitch', profile.id, email, profile.display_name || profile.login);
          done(null, user);
        }
      )
    );
  }

  if (process.env.KICK_CLIENT_ID) {
    passport.use(
      'kick',
      new OAuth2Strategy(
        {
          authorizationURL: process.env.KICK_AUTH_URL || 'https://id.kick.com/oauth/authorize',
          tokenURL: process.env.KICK_TOKEN_URL || 'https://id.kick.com/oauth/token',
          clientID: process.env.KICK_CLIENT_ID,
          clientSecret: process.env.KICK_CLIENT_SECRET,
          callbackURL: process.env.KICK_CALLBACK_URL
        },
        (accessToken, refreshToken, params, profile, done) => {
          const pseudoId = params?.sub || params?.user_id || `kick-${Date.now()}`;
          const user = upsertSocialUser('kick', String(pseudoId), null, 'Kick User');
          done(null, user);
        }
      )
    );
  }
}

export const oauthSuccess = (req, res) => {
  const token = signToken(req.user);
  res.redirect(`${process.env.OAUTH_SUCCESS_REDIRECT}?token=${token}`);
};
