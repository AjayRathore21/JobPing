import React from "react";
import { Form, Input, Button, Typography, message, Space } from "antd";
import { Link, Navigate, useNavigate } from "react-router";
import { UserAddOutlined } from "@ant-design/icons";
import axios from "../configs/axiosConfig";
import "./authForm.scss";
import AuthCheck from "../hooks/Authcheck";

const { Title, Text } = Typography;

const SignupPage = () => {
  const isAuthenticated = AuthCheck();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onFinish = async (values: any) => {
    try {
      const payload = {
        name: String(values.name),
        email: String(values.email),
        password: String(values.password),
      };
      await axios.post("/auth/signup", payload);
      message.success("Account created successfully! Please login.");
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error: any) {
      console.error("Signup error:", error?.response?.data || error.message);
      message.error(
        error?.response?.data?.message || "Signup failed. Please try again."
      );
    }
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
            Create your account
          </Title>
        </div>

        <Form
          layout="vertical"
          onFinish={onFinish}
          className="modern-auth-form"
        >
          <Form.Item
            label="Full Name"
            name="name"
            rules={[{ required: true, message: "Please input your name!" }]}
          >
            <Input
              placeholder="John Doe"
              size="large"
              className="modern-input"
            />
          </Form.Item>

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
              placeholder="Min. 8 characters"
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
              icon={<UserAddOutlined />}
              className="auth-btn"
            >
              Get Started
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-footer">
          <Text type="secondary">Already have an account? </Text>
          <Link to="/login" className="auth-toggle-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
