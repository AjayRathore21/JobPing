import User from "../model/User.js";

// config/passport.js
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";

export default function configurePassport(passport) {
  const opts = {
    jwtFromRequest: ExtractJwt.fromExtractors([
      ExtractJwt.fromAuthHeaderAsBearerToken(), // Optional: header
    ]),
    secretOrKey: process.env.JWT_SECRET_KEY, // Use env var in production
  };

  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        const user = await User.findById(jwt_payload.id).select("-password");
        if (user) return done(null, user); // attaches full user to req.user
        return done(null, false);
      } catch (err) {
        return done(err, false);
      }
    })
  );
}
