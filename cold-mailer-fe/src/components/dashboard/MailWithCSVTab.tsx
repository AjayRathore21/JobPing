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
import Papa from "papaparse";
import PreviewCsv from "../PreviewCsv";
import axios from "../../configs/axiosConfig";
import { useUserStore } from "../../store/userStore";
import "./MailWithCSVTab.scss";

const { Title, Text } = Typography;
const { Dragger } = Upload;
const { TextArea } = Input;

// Required columns for CSV validation
const REQUIRED_COLUMNS = ["email"];

interface MailWithCSVTabProps {
  setIsPreviewOpen: (open: boolean) => void;
}

const MailWithCSVTab: React.FC<MailWithCSVTabProps> = ({
  setIsPreviewOpen,
}) => {
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [validationStatus, setValidationStatus] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);

  const emailSubject = useUserStore((state) => state.emailSubject);
  const emailHtml = useUserStore((state) => state.emailHtml);
  const setEmailSubject = useUserStore((state) => state.setEmailSubject);
  const setEmailHtml = useUserStore((state) => state.setEmailHtml);
  const fetchCsvs = useUserStore((state) => state.fetchCsvs);

  // Validate CSV file columns
  const validateCsvFile = (
    file: RcFile
  ): Promise<{
    isValid: boolean;
    message: string;
  }> => {
    return new Promise((resolve) => {
      Papa.parse(file, {
        preview: 1, // Only parse header row
        complete: (results) => {
          if (results.data.length === 0) {
            resolve({
              isValid: false,
              message: "CSV file appears to be empty",
            });
            return;
          }

          const headers = (results.data[0] as string[]).map((h) =>
            h.toLowerCase().trim()
          );

          const missingRequired = REQUIRED_COLUMNS.filter(
            (col) => !headers.includes(col.toLowerCase())
          );

          if (missingRequired.length > 0) {
            resolve({
              isValid: false,
              message: `Missing required column: ${missingRequired.join(", ")}`,
            });
          } else {
            resolve({
              isValid: true,
              message: "CSV is valid and ready to upload",
            });
          }
        },
        error: (error) => {
          resolve({
            isValid: false,
            message: `Failed to parse CSV: ${error.message}`,
          });
        },
      });
    });
  };

  const handleUpload = () => {
    if (fileList.length === 0) {
      message.warning("Please select a file first");
      return;
    }

    if (!validationStatus?.isValid) {
      message.error("Please upload a valid CSV file with required columns");
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
        setValidationStatus(null);
        fetchCsvs();
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
      setValidationStatus(null);
    },
    beforeUpload: async (file: RcFile) => {
      // Validate CSV columns before accepting
      const validation = await validateCsvFile(file);
      setValidationStatus(validation);

      if (!validation.isValid) {
        message.error(validation.message);
        return Upload.LIST_IGNORE;
      }

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
              <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Click or drag file to this area to upload
                </p>
                <p className="ant-upload-hint">
                  CSV must have an <strong>email</strong> column. Recommended:{" "}
                  <strong>id</strong>, <strong>name</strong>
                </p>
              </Dragger>

              {validationStatus && (
                <div
                  className={`validation-status ${
                    validationStatus.isValid ? "valid" : "invalid"
                  }`}
                  style={{
                    marginTop: 12,
                    padding: "8px 12px",
                    borderRadius: 8,
                    backgroundColor: validationStatus.isValid
                      ? "rgba(16, 185, 129, 0.1)"
                      : "rgba(239, 68, 68, 0.1)",
                    color: validationStatus.isValid ? "#10B981" : "#EF4444",
                    fontSize: 13,
                  }}
                >
                  {validationStatus.message}
                </div>
              )}

              <Button
                type="primary"
                size="large"
                block
                shape="round"
                onClick={handleUpload}
                loading={uploading}
                disabled={fileList.length === 0 || !validationStatus?.isValid}
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
