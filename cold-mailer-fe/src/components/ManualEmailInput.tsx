import React, { useState } from "react";
import { Form, Input, Button, Space, message, Select } from "antd";
import { SendOutlined } from "@ant-design/icons";
import axios from "../configs/axiosConfig";
import {
  useUserStore,
  type CustomMail,
  type UserInfo,
} from "../store/userStore";
import "./ManualEmailInput.scss";

const ManualEmailInput: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const emailSubject = useUserStore((state) => state.emailSubject as string);
  const emailHtml = useUserStore((state) => state.emailHtml as string);

  const onFinish = async (values: {
    emails: string[];
    companyName?: string;
    location?: string;
  }) => {
    if (!user?.gmailRefreshToken) {
      message.error("Please sign in with Google to send emails.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/custom-mail", {
        emails: values.emails,
        companyName: values.companyName,
        location: values.location,
        subject: emailSubject,
        htmlContent: emailHtml,
      });

      message.success("Emails sent successfully!");
      form.resetFields();

      // Update global user state with new custom mails and stats
      if (user) {
        const customMails = response.data.customMails as CustomMail[];
        const updatedUser: UserInfo = {
          ...user,
          customMailSent: customMails,
          stats: {
            totalCampaigns: user.stats?.totalCampaigns || 0,
            totalOpens: user.stats?.totalOpens || 0,
            totalClicks: user.stats?.totalClicks || 0,
            totalEmailsSent:
              (user.stats?.totalEmailsSent || 0) + values.emails.length,
          },
        };
        setUser(updatedUser);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      console.error("Error sending custom mails:", err);
      message.error(err.response?.data?.error || "Failed to send emails");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manual-email-container">
      <h2 className="manual-email-title">Send Manual Emails</h2>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="emails"
          label="Email Addresses"
          rules={[
            { required: true, message: "Please input at least one email!" },
          ]}
        >
          <Select
            mode="tags"
            className="email-select"
            placeholder="Type email and press enter"
            tokenSeparators={[",", " "]}
          />
        </Form.Item>

        <Space className="input-group-space" align="baseline">
          <Form.Item
            name="companyName"
            label="Company Name (Optional)"
            className="flex-input"
          >
            <Input placeholder="Acme Inc" />
          </Form.Item>
          <Form.Item
            name="location"
            label="Location (Optional)"
            className="flex-input"
          >
            <Input placeholder="New York" />
          </Form.Item>
        </Space>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<SendOutlined />}
            size="large"
            className="submit-btn"
          >
            Send Emails
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ManualEmailInput;
