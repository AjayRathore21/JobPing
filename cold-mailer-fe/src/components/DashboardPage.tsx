import { useState } from "react";
import { Button, Typography, Modal, Tabs, Row, Col } from "antd";
import {
  FileTextOutlined,
  MailOutlined,
  SendOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import { useUserStore } from "../store/userStore";
import MailWithCSVTab from "./dashboard/MailWithCSVTab";
import CustomMailTab from "./dashboard/CustomMailTab";
import StatCard from "./dashboard/StatCard";
import "./DashboardPage.scss";

const { Title, Text } = Typography;

const DashboardPage = () => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const user = useUserStore((state) => state.user);

  const emailSubject = useUserStore((state) => state.emailSubject);
  const emailHtml = useUserStore((state) => state.emailHtml);

  const tabItems = [
    {
      key: "csv",
      label: (
        <span>
          <FileTextOutlined />
          Mail with CSV
        </span>
      ),
      children: <MailWithCSVTab setIsPreviewOpen={setIsPreviewOpen} />,
    },
    {
      key: "custom",
      label: (
        <span>
          <MailOutlined />
          Custom Mail
        </span>
      ),
      children: <CustomMailTab setIsPreviewOpen={setIsPreviewOpen} />,
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-welcome">
        <Title level={1}>
          Welcome back, {user?.name?.split(" ")[0] || "there"}!
        </Title>
        <Text type="secondary">
          Here's what's happening with your outreach campaigns today.
        </Text>
      </div>

      <div className="stats-grid">
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Emails Sent"
              value={Number(user?.stats?.totalEmailsSent || 0)}
              icon={<SendOutlined />}
              trend={{ value: 12, isUp: true }}
              color="#000000"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Opens"
              value={Number(user?.stats?.totalOpens || 0)}
              icon={<EyeOutlined />}
              trend={{ value: 5.1, isUp: true }}
              color="#5D5DFF"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Campaigns"
              value={Number(user?.stats?.totalCampaigns || 0)}
              icon={<LineChartOutlined />}
              color="#1A1A1A"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Success Rate"
              value="98.2%"
              icon={<CheckCircleOutlined />}
              trend={{ value: 2.4, isUp: true }}
              color="#FFD700"
            />
          </Col>
        </Row>
      </div>

      <div className="dashboard-main-content glass-card">
        <Tabs
          defaultActiveKey="csv"
          items={tabItems}
          className="custom-dashboard-tabs"
          size="large"
          type="line"
        />
      </div>

      <Modal
        title="Email Layout Preview"
        open={isPreviewOpen}
        onCancel={() => setIsPreviewOpen(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setIsPreviewOpen(false)}
          >
            Close Preview
          </Button>,
        ]}
        width={800}
        centered
        className="modern-modal"
      >
        <div className="preview-content">
          <div className="preview-info-chip">
            <Text type="secondary">Subject:</Text>
            <Text strong>{emailSubject || "(No Subject)"}</Text>
          </div>
          <div
            className="email-body-preview"
            dangerouslySetInnerHTML={{
              __html:
                emailHtml ||
                '<p class="preview-placeholder">No HTML content provided</p>',
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;
