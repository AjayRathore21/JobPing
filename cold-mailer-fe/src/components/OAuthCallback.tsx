import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { message, Spin } from "antd";
import { selectSetUser, useUserStore } from "../store/userStore";
import { setTokenToLS } from "../HelperMethods";
import axios from "../configs/axiosConfig";

/**
 * OAuth callback handler component
 * Handles the redirect from Google OAuth and stores the token
 */
const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setUser = useUserStore(selectSetUser);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const token = searchParams.get("token");
      const error = searchParams.get("error");

      if (error) {
        message.error("OAuth authentication failed. Please try again.");
        navigate("/login");
        return;
      }

      if (!token) {
        message.error("Invalid OAuth response. Please try again.");
        navigate("/login");
        return;
      }

      try {
        setTokenToLS(token);
        const response = await axios.get(`/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data?.user) {
          setUser(response.data.user);
          message.success("Successfully signed in with Google!");
          navigate("/dashboard");
        } else {
          throw new Error("User data missing");
        }
      } catch (err) {
        console.error("OAuth callback error:", err);
        message.error("Failed to retrieve user profile.");
        navigate("/login");
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, setUser]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <Spin size="large" />
      <p>Completing sign in...</p>
    </div>
  );
};

export default OAuthCallback;
