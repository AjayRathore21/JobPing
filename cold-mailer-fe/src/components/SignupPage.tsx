import React from "react";
import { Form, Input, Button, Typography } from "antd";
import { Link } from "react-router";
import "./authForm.scss";

const SignupPage: React.FC = () => {
  const onFinish = (values: any) => {
    // Handle signup logic here
    console.log("Signup values:", values);
  };

  return (
    <div className={"auth-form-container"}>
      <Typography.Title level={2} className={"auth-form-title"}>
        Sign Up
      </Typography.Title>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please input your name!" }]}
        >
          <Input placeholder="Name" />
        </Form.Item>
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
            Register
          </Button>
        </Form.Item>
      </Form>
      <div className={"auth-form-link"}>
        <Link to="/">Already have an account? Login</Link>
      </div>
    </div>
  );
};

export default SignupPage;
