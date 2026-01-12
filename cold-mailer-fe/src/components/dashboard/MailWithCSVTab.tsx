import React, { useState } from "react";
import {
  Button,
  Upload,
  message,
  Space,
  Row,
  Col,
  Input,
  Typography,
} from "antd";
import {
  InboxOutlined,
  UploadOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { UploadFile, RcFile } from "antd/es/upload/interface";
import PreviewCsv from "../PreviewCsv";
import axios from "../../configs/axiosConfig";
import { useUserStore } from "../../store/userStore";
import "./MailWithCSVTab.scss";

const { Title, Text } = Typography;
const { Dragger } = Upload;
const { TextArea } = Input;

interface MailWithCSVTabProps {
  setIsPreviewOpen: (open: boolean) => void;
}

const MailWithCSVTab: React.FC<MailWithCSVTabProps> = ({
  setIsPreviewOpen,
}) => {
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

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
    if (file.originFileObj) {
      formData.append("csv", file.originFileObj as File);
    } else if (file instanceof File) {
      formData.append("csv", file);
    }

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
    onRemove: (file: UploadFile) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file: RcFile) => {
      setFileList([file as UploadFile]);
      return false;
    },
    fileList,
    maxCount: 1,
    accept: ".csv",
  };

  return (
    <div className="mail-with-csv-tab">
      <Row gutter={[32, 32]} className="composer-row">
        <Col xs={24} lg={11}>
          <div className="composer-card">
            <div className="card-header">
              <Space>
                <div className="icon-badge">
                  <UploadOutlined />
                </div>
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    Import Contacts
                  </Title>
                  <Text type="secondary">
                    Upload your CSV file with lead data
                  </Text>
                </div>
              </Space>
            </div>

            <div className="card-body">
              <Dragger {...uploadProps} className="modern-dragger">
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Click or drag file to this area to upload
                </p>
                <p className="ant-upload-hint">
                  Support for a single .csv file only.
                </p>
              </Dragger>

              <Button
                type="primary"
                size="large"
                block
                shape="round"
                onClick={handleUpload}
                loading={uploading}
                disabled={fileList.length === 0}
                className="action-btn"
                style={{ marginTop: 24 }}
              >
                Upload & Process CSV
              </Button>
            </div>
          </div>
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
                  placeholder="e.g. Collaboration Opportunity with JobPing"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="modern-input"
                />
              </div>

              <div className="input-group" style={{ marginTop: 24 }}>
                <Text strong className="input-label">
                  Message Body (HTML Supported)
                </Text>
                <TextArea
                  placeholder="Hi {{name}}, I noticed your work at {{company}}..."
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
          <Title level={3}>Contacts Database</Title>
          <Text type="secondary">
            Manage your uploaded files and preview data before sending.
          </Text>
        </div>
        <PreviewCsv />
      </div>
    </div>
  );
};

export default MailWithCSVTab;
