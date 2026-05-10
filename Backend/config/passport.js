import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "./env.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.findOne({ email: profile.emails[0].value });
          if (user) {
            user.googleId = profile.id;
            user.isVerified = true; // Google emails are already verified
            await user.save();
          } else {
            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              isVerified: true,
              profilePic: profile.photos[0].value,
              password: Math.random().toString(36).slice(-10), // Random password for oauth users
            });
          }
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

export default passport;
