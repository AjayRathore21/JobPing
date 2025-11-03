import React from "react";
import { Form, Input, Button, Typography } from "antd";
import { Link } from "react-router";
import "./authForm.scss";

const LoginPage: React.FC = () => {
  const onFinish = (values: any) => {
    // Handle login logic here
    console.log("Login values:", values);
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
      <div className="auth-form-link">
        <Link to="/signup">Don’t have an account? Sign up</Link>
      </div>
    </div>
  );
};

export default LoginPage;
