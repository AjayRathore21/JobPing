import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Space,
  message,
  Select,
  Typography,
  Row,
  Col,
} from "antd";
import { SendOutlined, UserAddOutlined } from "@ant-design/icons";
import axios from "../configs/axiosConfig";
import {
  useUserStore,
  type CustomMail,
  type UserInfo,
} from "../store/userStore";
import "./ManualEmailInput.scss";

const { Title, Text } = Typography;

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
    <div className="manual-email-card glass-card">
      <div className="card-header">
        <Space>
          <div className="icon-badge">
            <UserAddOutlined />
          </div>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Direct Outreach
            </Title>
            <Text type="secondary">
              Send individual messages to specific leads
            </Text>
          </div>
        </Space>
      </div>

      <div className="card-body">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="modern-form"
        >
          <Form.Item
            name="emails"
            label={
              <Text strong className="input-label">
                Recipients
              </Text>
            }
            rules={[
              { required: true, message: "Please input at least one email!" },
            ]}
          >
            <Select
              mode="tags"
              className="modern-select"
              placeholder="Enter email addresses..."
              tokenSeparators={[",", " "]}
              size="large"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="companyName"
                label={
                  <Text strong className="input-label">
                    Company
                  </Text>
                }
              >
                <Input
                  placeholder="Acme Inc"
                  className="modern-input"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="location"
                label={
                  <Text strong className="input-label">
                    Location
                  </Text>
                }
              >
                <Input
                  placeholder="San Francisco"
                  className="modern-input"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, marginTop: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SendOutlined />}
              size="large"
              block
              shape="round"
              className="action-btn"
            >
              Dispatch Emails
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default ManualEmailInput;
