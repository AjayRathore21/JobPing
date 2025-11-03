import { Form, Input, Button, Typography, message } from "antd";
import { Link, useNavigate } from "react-router";
import axios from "../configs/axiosConfig";
import "./authForm.scss";

const SignupPage = () => {
  const navigate = useNavigate();
  const onFinish = async (values: any) => {

    console.log("Signup form values:", values);
    try {
      // Ensure all values are strings
      const payload = {
        name: String(values.name),
        email: String(values.email),
        password: String(values.password),
      };
      const response = await axios.post("/auth/signup", payload);
      console.log("Signup success:", response.data);
      // Optionally show success message or redirect
      message.success("Signup successful! Please login.");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error: any) {
      console.error("Signup error:", error?.response?.data || error.message);
      // Optionally show error message
      message.error("Signup failed. Please try again.");
    }
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
