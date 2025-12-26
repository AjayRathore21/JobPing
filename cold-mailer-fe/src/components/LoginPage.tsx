import { Form, Input, Button, Typography, message, Divider } from "antd";
import { GoogleOutlined } from "@ant-design/icons";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import axios from "../configs/axiosConfig";
import { AxiosError } from "axios";
import "./authForm.scss";
import { selectSetUser, useUserStore } from "../store/userStore";
import { setTokenToLS } from "../HelperMethods";
import AuthCheck from "../hooks/Authcheck";
import { useEffect } from "react";

const LoginPage = () => {
  const isAuthenticated = AuthCheck();
  const navigate = useNavigate();
  const setUser = useUserStore(selectSetUser);
  const [searchParams] = useSearchParams();

  // Check for OAuth error in URL
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "oauth_failed") {
      message.error("Google sign-in failed. Please try again.");
    }
  }, [searchParams]);

  // Redirect to dashboard if already logged in
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onFinish = async (values: Record<string, string>) => {
    try {
      const payload = {
        email: String(values.email),
        password: String(values.password),
      };
      const response = await axios.post("/auth/login", payload);
      const { user, token } = response.data;
      console.log("Login success:", response.data);
      // Store user information in Zustand
      setUser(user);
      setTokenToLS(token);
      message.success("Login successful!");

      setTimeout(() => {
        navigate(
          "/dashboard" // Replace with the actual route you want to navigate to after login
        );
      }, 1000);
      // Optionally handle login success (e.g., redirect, store token)
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error("Login error:", axiosError.response?.data?.message);

      message.error(axiosError.response?.data?.message || "An error occurred");
    }
  };

  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_BASE_URL;
    const googleAuthUrl = `${backendUrl}/auth/google`;

    window.location.href = googleAuthUrl;
  };

  return (
    <div className="auth-form-container">
      <Typography.Title level={2} className="auth-form-title">
        Login
      </Typography.Title>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: "Please input your email!" }]}
        >
          <Input type="email" placeholder="Email" />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input.Password placeholder="Password" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Login
          </Button>
        </Form.Item>
      </Form>
      <Divider>or</Divider>
      <Button
        icon={<GoogleOutlined />}
        onClick={handleGoogleLogin}
        block
        size="large"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        Sign in with Google
      </Button>
      <div className="auth-form-link" style={{ marginTop: "16px" }}>
        <Link to="/signup">Don't have an account? Sign up</Link>
      </div>
    </div>
  );
};

export default LoginPage;
