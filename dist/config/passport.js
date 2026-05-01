import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { nanoid } from 'nanoid';
import db from "../libs/db.js";
//dotenv.config();
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BACKEND_URL, } = process.env;
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        const avatar = profile.photos?.[0]?.value;
        // generate 12-char id
        const publicId = nanoid(12);
        const user = await db.user.upsert({
            where: { googleId: profile.id },
            update: { name: profile.displayName, email, avatar },
            create: { googleId: profile.id, name: profile.displayName, email, avatar, publicId },
        });
        // ✅ Send login notification (non-blocking)
        done(null, user);
        //console.log("User:", user);
    }
    catch (error) {
        done(error, null);
    }
}));
export default passport;
