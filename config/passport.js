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
      proxy: true, // ✅ CRITICAL: Tells Passport to trust the Render reverse proxy
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // ✅ BUG FIX: Safely extract email and photo using Optional Chaining (?.)
        const email = profile.emails?.[0]?.value;
        const avatarUrl = profile.photos?.[0]?.value || "";

        if (!email) {
          return done(new Error("No email found from Google account."), null);
        }

        let user = await User.findOne({ email: email });
        if (!user) {
          user = new User({
            email: email,
            authProvider: "google",
          });
          await user.save();

          const newProfile = new Profile({
            user_id: user._id,
            username:
              profile.displayName.replace(/\s+/g, "").toLowerCase() +
              Math.floor(Math.random() * 1000),
            full_name: profile.displayName,
            avatar_url: avatarUrl,
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
      proxy: true, // ✅ CRITICAL: Tells Passport to trust the Render reverse proxy
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // ✅ BUG FIX: Safely extract email. If private, use a fallback dummy email so DB doesn't crash
        const email =
          profile.emails?.[0]?.value || `${profile.username}@github.user`;

        // ✅ BUG FIX: Safely extract photo
        const avatarUrl = profile.photos?.[0]?.value || "";

        let user = await User.findOne({ email: email });
        if (!user) {
          user = new User({
            email: email,
            authProvider: "github",
          });
          await user.save();

          const newProfile = new Profile({
            user_id: user._id,
            username: profile.username.toLowerCase(),
            full_name: profile.displayName || profile.username,
            avatar_url: avatarUrl,
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
