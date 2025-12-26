import User from "../model/User.js";

// config/passport.js
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

export default function configurePassport(passport) {
  // JWT Strategy (existing)
  const jwtOpts = {
    jwtFromRequest: ExtractJwt.fromExtractors([
      ExtractJwt.fromAuthHeaderAsBearerToken(), // Optional: header
    ]),
    secretOrKey: process.env.JWT_SECRET_KEY, // Use env var in production
  };

  passport.use(
    new JwtStrategy(jwtOpts, async (jwt_payload, done) => {
      try {
        const user = await User.findById(jwt_payload.id).select("-password");
        if (user) return done(null, user); // attaches full user to req.user
        return done(null, false);
      } catch (err) {
        return done(err, false);
      }
    })
  );

  // Google OAuth Strategy
  const googleOpts = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ["profile", "email", "https://www.googleapis.com/auth/gmail.send"],
    accessType: "offline",
    prompt: "consent",
  };

  passport.use(
    new GoogleStrategy(
      googleOpts,
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;
          const name = profile.displayName || email?.split("@")[0] || "User";

          console.log("Google OAuth callback:@@@", profile);

          // Check if user exists by googleId or email
          let user = await User.findOne({
            $or: [{ googleId }, { email }],
          });

          if (user) {
            // Update existing user with Google OAuth tokens
            user.googleId = googleId;
            user.gmailAccessToken = accessToken;
            if (refreshToken) {
              user.gmailRefreshToken = refreshToken;
            }
            user.gmailTokenExpiry = new Date(Date.now() + 3600 * 1000); // 1 hour from now
            await user.save();
          } else {
            // Create new user
            user = await User.create({
              googleId,
              email,
              name,
              gmailAccessToken: accessToken,
              gmailRefreshToken: refreshToken,
              gmailTokenExpiry: new Date(Date.now() + 3600 * 1000),
            });
          }

          return done(null, user);
        } catch (err) {
          console.error("Google OAuth Error:", err);
          return done(err, false);
        }
      }
    )
  );
}
