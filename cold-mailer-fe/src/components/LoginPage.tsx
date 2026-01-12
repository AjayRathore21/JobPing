import React, { useEffect } from "react";
import { Form, Input, Button, Typography, message, Divider, Space } from "antd";
import { GoogleOutlined, LoginOutlined } from "@ant-design/icons";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import axios from "../configs/axiosConfig";
import { AxiosError } from "axios";
import "./authForm.scss";
import { selectSetUser, useUserStore } from "../store/userStore";
import { setTokenToLS } from "../HelperMethods";
import AuthCheck from "../hooks/Authcheck";

const { Title, Text } = Typography;

const LoginPage = () => {
  const isAuthenticated = AuthCheck();
  const navigate = useNavigate();
  const setUser = useUserStore(selectSetUser);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "oauth_failed") {
      message.error("Google sign-in failed. Please try again.");
    }
  }, [searchParams]);

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
      setUser(user);
      setTokenToLS(token);
      message.success("Welcome back!");
      navigate("/dashboard");
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      message.error(axiosError.response?.data?.message || "An error occurred");
    }
  };

  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_BASE_URL;
    window.location.href = `${backendUrl}/auth/google`;
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <div className="logo-section">
            <Title level={2} className="brand-logo">
              JobPing
            </Title>
            <Text type="secondary">The ultimate tool for cold outreach</Text>
          </div>
          <Title level={3} className="auth-title">
            Log in to your account
          </Title>
        </div>

        <Form
          layout="vertical"
          onFinish={onFinish}
          className="modern-auth-form"
        >
          <Form.Item
            label="Email Address"
            name="email"
            rules={[{ required: true, message: "Please input your email!" }]}
          >
            <Input
              type="email"
              placeholder="name@company.com"
              size="large"
              className="modern-input"
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password
              placeholder="Enter your password"
              size="large"
              className="modern-input"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              shape="round"
              icon={<LoginOutlined />}
              className="auth-btn"
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary">or continue with</Text>
        </Divider>

        <Button
          icon={<GoogleOutlined />}
          onClick={handleGoogleLogin}
          block
          size="large"
          shape="round"
          className="google-btn"
        >
          Google Account
        </Button>

        <div className="auth-footer">
          <Text type="secondary">New here? </Text>
          <Link to="/signup" className="auth-toggle-link">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
