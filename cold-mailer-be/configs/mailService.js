import nodemailer from "nodemailer";
import { google } from "googleapis";
import User from "../model/User.js";

/**
 * Creates an OAuth2-authenticated nodemailer transporter for the user
 * @param {Object} user - User object with Gmail OAuth tokens
 * @returns {Promise<nodemailer.Transporter>}
 */
export const createGmailTransporter = async (user) => {
  // Check if user has OAuth tokens
  if (!user.gmailRefreshToken) {
    throw new Error(
      "Gmail OAuth not configured. Please sign in with Google to send emails."
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: user.gmailRefreshToken,
  });

  // Get a fresh access token
  let accessToken;
  try {
    const { token, res } = await oauth2Client.getAccessToken();
    accessToken = token;

    // Log the scopes to verify gmail.send is present
    const scopes = res?.data?.scope || "No scopes found in response";
    console.log("Successfully retrieved access token for user:", user.email);
    console.log("Authorized Scopes:", scopes);

    if (!scopes.includes("https://www.googleapis.com/auth/gmail.send")) {
      console.warn("CRITICAL: Token DOES NOT have gmail.send scope!");
    }
  } catch (getTokenError) {
    console.error("Error retrieving access token:", getTokenError);
    throw new Error(
      `Failed to obtain Gmail access token: ${getTokenError.message}. Please re-authenticate.`
    );
  }

  if (!accessToken) {
    console.error("Access token is undefined after getAccessToken call.");
    throw new Error(
      "Failed to obtain Gmail access token. Token was undefined."
    );
  }

  // Update user's access token in database
  await User.findByIdAndUpdate(user._id, {
    gmailAccessToken: accessToken,
    gmailTokenExpiry: new Date(Date.now() + 3600 * 1000),
  });

  console.log("Configuring nodemailer for user:", user.email);
  console.log(
    "Using Refresh Token (last 4 chars):",
    user.gmailRefreshToken.slice(-4)
  );

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // use SSL
    auth: {
      type: "OAuth2",
      user: user.email,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: user.gmailRefreshToken,
      accessToken: accessToken,
    },
  });

  transporter.on("token", (token) => {
    console.log("A new access token was generated");
    console.log("User: %s", token.user);
    console.log("Access Token: %s", token.accessToken);
    console.log("Expires: %s", new Date(token.expires));
  });

  return transporter;
};

export default createGmailTransporter;
