import React, { useState } from "react";
import {
  Typography,
  Table,
  Tag,
  Space,
  Row,
  Col,
  Input,
  Button,
  Modal,
  Form,
  Tooltip,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EditOutlined,
  EyeOutlined,
  FolderOpenOutlined,
  ThunderboltOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import ManualEmailInput from "../ManualEmailInput";
import SavedTemplatesModal from "../SavedTemplatesModal";
import { useUserStore, type CustomMail } from "../../store/userStore";
import { useTemplateStore } from "../../store/templateStore";
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
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [saveForm] = Form.useForm();
  const [generateForm] = Form.useForm();

  const user = useUserStore((state) => state.user);
  const emailSubject = useUserStore((state) => state.emailSubject);
  const emailHtml = useUserStore((state) => state.emailHtml);
  const setEmailSubject = useUserStore((state) => state.setEmailSubject);
  const setEmailHtml = useUserStore((state) => state.setEmailHtml);

  const saveTemplate = useTemplateStore((state) => state.saveTemplate);
  const generateTemplate = useTemplateStore((state) => state.generateTemplate);
  const isGenerating = useTemplateStore((state) => state.isGenerating);
  const isLoading = useTemplateStore((state) => state.isLoading);

  const handleSaveTemplate = async (values: {
    name: string;
    isDefault?: boolean;
  }) => {
    if (!emailSubject || !emailHtml) {
      return;
    }

    const result = await saveTemplate({
      name: values.name,
      subject: emailSubject,
      body: emailHtml,
      isDefault: values.isDefault,
    });

    if (result) {
      setIsSaveTemplateModalOpen(false);
      saveForm.resetFields();
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
      setIsGenerateModalOpen(false);
      generateForm.resetFields();
    } else {
      const error = useTemplateStore.getState().error;
      message.error(error || "Failed to generate template");
    }
  };

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
                  placeholder="Hi {{name}}, I noticed your work at {{company_name}}..."
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

export default CustomMailTab;
