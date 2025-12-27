import React from "react";
import {
  Card,
  Col,
  Row,
  Statistic,
  Table,
  Typography,
  Progress,
  Space,
} from "antd";
import {
  SendOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import "./AnalyticsPage.scss";

const { Title, Text } = Typography;

const AnalyticsPage: React.FC = () => {
  // Mock data for analytics
  const stats = [
    {
      title: "Total Emails Sent",
      value: 12540,
      icon: <SendOutlined />,
      color: "#1890ff",
    },
    {
      title: "Open Rate",
      value: 68.4,
      suffix: "%",
      icon: <EyeOutlined />,
      color: "#52c41a",
    },
    {
      title: "Deliverability",
      value: 99.2,
      suffix: "%",
      icon: <CheckCircleOutlined />,
      color: "#722ed1",
    },
    {
      title: "Bounce Rate",
      value: 0.8,
      suffix: "%",
      icon: <CloseCircleOutlined />,
      color: "#f5222d",
    },
  ];

  const recentCampaigns = [
    { key: "1", name: "Q4 Outreach", sent: 5000, opened: 3400, rate: 68 },
    { key: "2", name: "Tech Leads", sent: 3000, opened: 2100, rate: 70 },
    { key: "3", name: "Startup Founders", sent: 4540, opened: 3087, rate: 68 },
  ];

  const columns = [
    { title: "Campaign Name", dataIndex: "name", key: "name" },
    { title: "Sent", dataIndex: "sent", key: "sent" },
    { title: "Opened", dataIndex: "opened", key: "opened" },
    {
      title: "Open Rate",
      dataIndex: "rate",
      key: "rate",
      render: (rate: number) => (
        <Space size="middle">
          <Progress percent={rate} size="small" style={{ width: 100 }} />
          <Text>{rate}%</Text>
        </Space>
      ),
    },
  ];

  return (
    <div className="analytics-page">
      <div style={{ marginBottom: "32px" }}>
        <Title level={2} style={{ margin: 0 }}>
          Analytics
        </Title>
        <Text type="secondary">
          Track your email performance and campaign success
        </Text>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card bordered={false} className="stat-card">
              <Statistic
                title={<Text type="secondary">{stat.title}</Text>}
                value={stat.value}
                precision={stat.suffix === "%" ? 1 : 0}
                suffix={stat.suffix}
                prefix={
                  <div className="stat-icon" style={{ background: stat.color }}>
                    {stat.icon}
                  </div>
                }
                valueStyle={{ color: "#1e293b", fontWeight: 700 }}
              />
              <div style={{ marginTop: 12 }}>
                <Text type="success" style={{ fontSize: 12 }}>
                  <RiseOutlined /> +12% from last month
                </Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card
            title="Recent Campaign Performance"
            bordered={false}
            className="table-card"
            style={{
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          >
            <Table
              dataSource={recentCampaigns}
              columns={columns}
              pagination={false}
              className="custom-table"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsPage;
