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
  Modal,
  Form,
  Tooltip,
} from "antd";
import {
  InboxOutlined,
  UploadOutlined,
  EditOutlined,
  EyeOutlined,
  FolderOpenOutlined,
  ThunderboltOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import type { UploadFile, RcFile } from "antd/es/upload/interface";
import Papa from "papaparse";
import PreviewCsv from "../PreviewCsv";
import SavedTemplatesModal from "../SavedTemplatesModal";
import axios from "../../configs/axiosConfig";
import { useUserStore } from "../../store/userStore";
import { useTemplateStore } from "../../store/templateStore";
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
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [saveForm] = Form.useForm();
  const [generateForm] = Form.useForm();

  const emailSubject = useUserStore((state) => state.emailSubject);
  const emailHtml = useUserStore((state) => state.emailHtml);
  const setEmailSubject = useUserStore((state) => state.setEmailSubject);
  const setEmailHtml = useUserStore((state) => state.setEmailHtml);
  const fetchCsvs = useUserStore((state) => state.fetchCsvs);

  const saveTemplate = useTemplateStore((state) => state.saveTemplate);
  const generateTemplate = useTemplateStore((state) => state.generateTemplate);
  const isGenerating = useTemplateStore((state) => state.isGenerating);
  const isLoading = useTemplateStore((state) => state.isLoading);

  const handleSaveTemplate = async (values: {
    name: string;
    isDefault?: boolean;
  }) => {
    if (!emailSubject || !emailHtml) {
      message.error("Please fill in both subject and body before saving");
      return;
    }

    const result = await saveTemplate({
      name: values.name,
      subject: emailSubject,
      body: emailHtml,
      isDefault: values.isDefault,
    });

    if (result) {
      message.success(`Template "${values.name}" saved!`);
      setIsSaveTemplateModalOpen(false);
      saveForm.resetFields();
    } else {
      message.error("Failed to save template");
    }
  };

  const handleGenerateTemplate = async (values: {
    purpose: string;
    target?: string;
    tone?: string;
  }) => {
    const result = await generateTemplate(values);

    if (result) {
      setEmailSubject(result.subject);
      setEmailHtml(result.body);
      message.success("Template generated!");
      setIsGenerateModalOpen(false);
      generateForm.resetFields();
    } else {
      const error = useTemplateStore.getState().error;
      message.error(error || "Failed to generate template");
    }
  };

  // Validate CSV file columns
  const validateCsvFile = (
    file: RcFile,
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
            h.toLowerCase().trim(),
          );

          const missingRequired = REQUIRED_COLUMNS.filter(
            (col) => !headers.includes(col.toLowerCase()),
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

              <Space size="small">
                <Tooltip title="View Saved Templates">
                  <Button
                    shape="circle"
                    icon={<FolderOpenOutlined />}
                    onClick={() => setIsTemplatesModalOpen(true)}
                  />
                </Tooltip>
                <Tooltip title="Preview Email">
                  <Button
                    shape="circle"
                    icon={<EyeOutlined />}
                    onClick={() => setIsPreviewOpen(true)}
                    disabled={!emailHtml}
                  />
                </Tooltip>
              </Space>
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

              <div
                className="template-actions"
                style={{ marginTop: 20, display: "flex", gap: 12 }}
              >
                <Button
                  icon={<ThunderboltOutlined />}
                  onClick={() => setIsGenerateModalOpen(true)}
                  loading={isGenerating}
                >
                  Generate with AI
                </Button>
                <Button
                  icon={<SaveOutlined />}
                  onClick={() => setIsSaveTemplateModalOpen(true)}
                  disabled={!emailSubject || !emailHtml}
                >
                  Save as Template
                </Button>
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

      {/* Saved Templates Modal */}
      <SavedTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
      />

      {/* Save Template Modal */}
      <Modal
        title="Save as Template"
        open={isSaveTemplateModalOpen}
        onCancel={() => {
          setIsSaveTemplateModalOpen(false);
          saveForm.resetFields();
        }}
        footer={null}
        width={400}
        centered
      >
        <Form form={saveForm} layout="vertical" onFinish={handleSaveTemplate}>
          <Form.Item
            name="name"
            label="Template Name"
            rules={[
              { required: true, message: "Please enter a template name" },
            ]}
          >
            <Input placeholder="e.g., Job Application Template" />
          </Form.Item>
          <Form.Item name="isDefault" valuePropName="checked">
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" />
              Set as default template
            </label>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isLoading} block>
              Save Template
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Generate Template Modal */}
      <Modal
        title="Generate Email Template with AI"
        open={isGenerateModalOpen}
        onCancel={() => {
          setIsGenerateModalOpen(false);
          generateForm.resetFields();
        }}
        footer={null}
        width={500}
        centered
      >
        <Form
          form={generateForm}
          layout="vertical"
          onFinish={handleGenerateTemplate}
        >
          <Form.Item
            name="purpose"
            label="What is the purpose of this email?"
            rules={[{ required: true, message: "Please describe the purpose" }]}
          >
            <Input placeholder="e.g., Reaching out for job opportunities" />
          </Form.Item>
          <Form.Item
            name="target"
            label="Who is the target audience? (optional)"
          >
            <Input placeholder="e.g., Recruiters and hiring managers" />
          </Form.Item>
          <Form.Item name="tone" label="Preferred tone (optional)">
            <Input placeholder="e.g., Professional but friendly" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isGenerating}
              block
              icon={<ThunderboltOutlined />}
            >
              Generate Template
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MailWithCSVTab;
