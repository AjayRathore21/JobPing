import { Form, Input, Button, Typography, message } from "antd";
import { Link, useNavigate } from "react-router";
import axios from "../configs/axiosConfig";
import "./authForm.scss";
import { selectSetUser, useUserStore } from "../store/userStore";
import { setTokenToLS } from "../HelperMethods";

const LoginPage = () => {
  const navigate = useNavigate();
  const setUser = useUserStore(selectSetUser);
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
    } catch (error: unknown) {
      console.error("Login error:", error);

      // Optionally show error message
    }
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
