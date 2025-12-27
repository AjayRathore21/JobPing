import { useState } from "react";
import {
  Button,
  Card,
  Typography,
  Upload,
  message,
  Divider,
  Input,
  Modal,
  Space,
} from "antd";
import {
  InboxOutlined,
  UploadOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import PreviewCsv from "./PreviewCsv";
import axios from "../configs/axiosConfig";
import { useUserStore } from "../store/userStore";

const { Title, Text } = Typography;
const { Dragger } = Upload;
const { TextArea } = Input;

const DashboardPage = () => {
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const emailSubject = useUserStore((state) => state.emailSubject);
  const emailHtml = useUserStore((state) => state.emailHtml);
  const setEmailSubject = useUserStore((state) => state.setEmailSubject);
  const setEmailHtml = useUserStore((state) => state.setEmailHtml);

  const handleUpload = () => {
    if (fileList.length === 0) {
      message.warning("Please select a file first");
      return;
    }

    const file = fileList[0];
    const formData = new FormData();
    formData.append("csv", file);

    setUploading(true);
    axios
      .post("/upload/csv", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then(() => {
        message.success("File uploaded successfully");
        setFileList([]);
      })
      .catch((err) => {
        console.error("Upload error:", err);
        message.error("Failed to upload file");
      })
      .finally(() => {
        setUploading(false);
      });
  };

  const uploadProps = {
    onRemove: (file: any) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file: any) => {
      setFileList([file]);
      return false;
    },
    fileList,
    maxCount: 1,
    accept: ".csv",
  };

  return (
    <div className="dashboard-page">
      <div
        style={{
          marginBottom: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Dashboard
          </Title>
          <Text type="secondary">
            Manage your email outreach and campaign data
          </Text>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        <Card
          title={
            <Space>
              <UploadOutlined />
              <span>Upload Contacts</span>
            </Space>
          }
          bordered={false}
          style={{
            height: "100%",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            borderRadius: "12px",
          }}
        >
          <Dragger
            {...uploadProps}
            style={{
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px dashed #cbd5e1",
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: "#1890ff" }} />
            </p>
            <p className="ant-upload-text">Drag CSV file here</p>
            <Button
              type="primary"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleUpload();
              }}
              loading={uploading}
              disabled={fileList.length === 0}
              style={{ marginTop: "12px" }}
            >
              Upload CSV
            </Button>
          </Dragger>
        </Card>

        <Card
          title={
            <Space>
              <EditOutlined />
              <span>Email Content Editor</span>
            </Space>
          }
          bordered={false}
          style={{
            height: "100%",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            borderRadius: "12px",
          }}
          extra={
            <Button
              icon={<EyeOutlined />}
              onClick={() => setIsPreviewOpen(true)}
              disabled={!emailHtml}
            >
              Preview
            </Button>
          }
        >
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <div>
              <Text strong>Email Subject</Text>
              <Input
                placeholder="Enter email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                style={{ marginTop: "8px" }}
              />
            </div>
            <div>
              <Text strong>HTML Layout / Message</Text>
              <TextArea
                placeholder="Enter HTML content or plain text..."
                rows={6}
                value={emailHtml}
                onChange={(e) => setEmailHtml(e.target.value)}
                style={{ marginTop: "8px", fontFamily: "monospace" }}
              />
            </div>
          </Space>
        </Card>
      </div>

      <Divider />

      <Title level={4} style={{ marginBottom: "24px" }}>
        Data Overview
      </Title>
      <PreviewCsv />

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
        <div
          style={{
            border: "1px solid #f1f5f9",
            padding: "24px",
            minHeight: "300px",
            borderRadius: "8px",
            background: "#fff",
          }}
        >
          <div
            style={{
              marginBottom: "16px",
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: "12px",
            }}
          >
            <Text type="secondary">Subject:</Text>{" "}
            <Text strong>{emailSubject || "(No Subject)"}</Text>
          </div>
          <div
            dangerouslySetInnerHTML={{
              __html:
                emailHtml ||
                '<p style="color: #94a3b8; text-align: center; margin-top: 100px;">No HTML content provided</p>',
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;
