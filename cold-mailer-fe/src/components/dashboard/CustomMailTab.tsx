import React from "react";
import { Typography, Table, Tag, Space, Row, Col, Input, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import ManualEmailInput from "../ManualEmailInput";
import { useUserStore, type CustomMail } from "../../store/userStore";
import "./CustomMailTab.scss";

const { Title, Text } = Typography;
const { TextArea } = Input;

const CUSTOM_MAIL_COLUMNS: ColumnsType<CustomMail> = [
  {
    title: "Email",
    dataIndex: "emailId",
    key: "emailId",
    ellipsis: true,
    width: 180,
  },
  {
    title: "Company",
    dataIndex: "company",
    key: "company",
    width: 120,
    render: (text) => text || "-",
  },
  {
    title: "Location",
    dataIndex: "location",
    key: "location",
    width: 120,
    render: (text) => text || "-",
  },
  {
    title: "Status",
    dataIndex: "openedStatus",
    key: "openedStatus",
    width: 100,
    render: (opened: boolean) => (
      <Tag
        color={opened ? "success" : "processing"}
        style={{ borderRadius: "100px", padding: "0 12px" }}
      >
        {opened ? "Opened" : "Sent"}
      </Tag>
    ),
  },
  {
    title: "Sent At",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 160,
    render: (date: string) => (
      <Text type="secondary">{new Date(date).toLocaleString()}</Text>
    ),
  },
];

interface CustomMailTabProps {
  setIsPreviewOpen: (open: boolean) => void;
}

const CustomMailTab: React.FC<CustomMailTabProps> = ({ setIsPreviewOpen }) => {
  const user = useUserStore((state) => state.user);
  const emailSubject = useUserStore((state) => state.emailSubject);
  const emailHtml = useUserStore((state) => state.emailHtml);
  const setEmailSubject = useUserStore((state) => state.setEmailSubject);
  const setEmailHtml = useUserStore((state) => state.setEmailHtml);

  return (
    <div className="custom-mail-tab">
      <Row gutter={[32, 32]} className="composer-row">
        <Col xs={24} lg={11}>
          <ManualEmailInput />
        </Col>

        <Col xs={24} lg={13}>
          <div className="composer-card">
            <div
              className="card-header"
              style={{
                justifyContent: "space-between",
                display: "flex",
                width: "100%",
                alignItems: "center",
              }}
            >
              <Space>
                <div
                  className="icon-badge"
                  style={{ backgroundColor: "#FFD700", color: "#000" }}
                >
                  <EditOutlined />
                </div>
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    Email Composer
                  </Title>
                  <Text type="secondary">Draft your message and templates</Text>
                </div>
              </Space>

              <Button
                shape="circle"
                icon={<EyeOutlined />}
                onClick={() => setIsPreviewOpen(true)}
                disabled={!emailHtml}
              />
            </div>

            <div className="card-body">
              <div className="input-group">
                <Text strong className="input-label">
                  Subject Line
                </Text>
                <Input
                  placeholder="e.g. Collaboration Opportunity"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="modern-input"
                />
              </div>

              <div className="input-group" style={{ marginTop: 24 }}>
                <Text strong className="input-label">
                  Message Body
                </Text>
                <TextArea
                  placeholder="Type your personal message here..."
                  rows={6}
                  value={emailHtml}
                  onChange={(e) => setEmailHtml(e.target.value)}
                  className="modern-textarea"
                />
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <div className="data-overview-section">
        <div className="section-header">
          <Title level={3}>Manually Sent Emails</Title>
          <Text type="secondary">
            Track individual outreach messages and their status.
          </Text>
        </div>
        <Table
          dataSource={user?.customMailSent || []}
          columns={CUSTOM_MAIL_COLUMNS}
          rowKey="_id"
          pagination={{ pageSize: 8 }}
          className="custom-table"
          scroll={{ x: 680 }}
          locale={{ emptyText: "No manual emails sent yet" }}
        />
      </div>
    </div>
  );
};

export default CustomMailTab;
