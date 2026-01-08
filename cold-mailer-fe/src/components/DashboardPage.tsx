import { useState } from "react";
import { Button, Typography, Modal, Tabs } from "antd";
import { FileTextOutlined, MailOutlined } from "@ant-design/icons";
import { useUserStore } from "../store/userStore";
import MailWithCSVTab from "./dashboard/MailWithCSVTab";
import CustomMailTab from "./dashboard/CustomMailTab";
import "./DashboardPage.scss";

const { Title, Text } = Typography;

const DashboardPage = () => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const emailSubject = useUserStore((state) => state.emailSubject);
  const emailHtml = useUserStore((state) => state.emailHtml);

  const tabItems = [
    {
      key: "csv",
      label: (
        <span>
          <FileTextOutlined style={{ marginRight: "8px" }} />
          Mail with CSV
        </span>
      ),
      children: <MailWithCSVTab setIsPreviewOpen={setIsPreviewOpen} />,
    },
    {
      key: "custom",
      label: (
        <span>
          <MailOutlined style={{ marginRight: "8px" }} />
          Custom Mail
        </span>
      ),
      children: <CustomMailTab setIsPreviewOpen={setIsPreviewOpen} />,
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <Title level={2} className="dashboard-title">
            Dashboard
          </Title>
          <Text type="secondary">
            Manage your email outreach and campaign data
          </Text>
        </div>
      </div>

      <div className="dashboard-tabs-container">
        <Tabs
          defaultActiveKey="csv"
          items={tabItems}
          className="dashboard-tabs"
          size="large"
          type="line"
          centered
        />
      </div>

      <Modal
        title="Email Layout Preview"
        open={isPreviewOpen}
        onCancel={() => setIsPreviewOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsPreviewOpen(false)}>
            Close Preview
          </Button>,
        ]}
        width={800}
        centered
      >
        <div className="preview-content">
          <div className="preview-header">
            <Text type="secondary">Subject:</Text>{" "}
            <Text strong>{emailSubject || "(No Subject)"}</Text>
          </div>
          <div
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
