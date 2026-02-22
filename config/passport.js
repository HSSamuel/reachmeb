const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");
const Profile = require("../models/Profile");

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (!user) {
          user = new User({
            email: profile.emails[0].value,
            authProvider: "google",
          });
          await user.save();

          const newProfile = new Profile({
            user_id: user._id,
            username:
              profile.displayName.replace(/\s+/g, "").toLowerCase() +
              Math.floor(Math.random() * 1000),
            full_name: profile.displayName,
            avatar_url: profile.photos[0].value,
          });
          await newProfile.save();
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/api/auth/github/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (!user) {
          user = new User({
            email: profile.emails[0].value,
            authProvider: "github",
          });
          await user.save();

          const newProfile = new Profile({
            user_id: user._id,
            username: profile.username.toLowerCase(),
            full_name: profile.displayName || profile.username,
            avatar_url: profile.photos[0].value,
          });
          await newProfile.save();
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

module.exports = passport;
