import React, { useEffect, useState } from "react";
import {
  Modal,
  List,
  Button,
  Typography,
  Empty,
  Spin,
  Popconfirm,
  Tag,
  message,
  Input,
} from "antd";
import {
  FileTextOutlined,
  DeleteOutlined,
  CheckOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useTemplateStore, type EmailTemplate } from "../store/templateStore";
import { useUserStore } from "../store/userStore";
import "./SavedTemplatesModal.scss";

const { Text, Paragraph } = Typography;

interface SavedTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SavedTemplatesModal: React.FC<SavedTemplatesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const templates = useTemplateStore((state) => state.templates);
  const isLoading = useTemplateStore((state) => state.isLoading);
  const fetchTemplates = useTemplateStore((state) => state.fetchTemplates);
  const deleteTemplate = useTemplateStore((state) => state.deleteTemplate);
  const setEmailSubject = useUserStore((state) => state.setEmailSubject);
  const setEmailHtml = useUserStore((state) => state.setEmailHtml);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, fetchTemplates]);

  const handleUseTemplate = (template: EmailTemplate) => {
    setEmailSubject(template.subject);
    setEmailHtml(template.body);
    message.success(`Template "${template.name}" loaded!`);
    onClose();
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    const success = await deleteTemplate(id);
    if (success) {
      message.success(`Template "${name}" deleted`);
    } else {
      message.error("Failed to delete template");
    }
  };

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Modal
      title={
        <div className="modal-header">
          <FileTextOutlined className="header-icon" />
          <span>Saved Email Templates</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={700}
      className="saved-templates-modal"
      centered
    >
      <div className="search-bar">
        <Input
          placeholder="Search templates..."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
        />
      </div>

      {isLoading ? (
        <div className="loading-container">
          <Spin size="large" />
          <Text type="secondary">Loading templates...</Text>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            searchQuery
              ? "No templates match your search"
              : "No saved templates yet"
          }
        />
      ) : (
        <List
          className="templates-list"
          dataSource={filteredTemplates}
          renderItem={(template) => (
            <List.Item
              className="template-item"
              actions={[
                <Button
                  key="use"
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => handleUseTemplate(template)}
                >
                  Use
                </Button>,
                <Popconfirm
                  key="delete"
                  title="Delete this template?"
                  onConfirm={() =>
                    handleDeleteTemplate(template._id, template.name)
                  }
                  okText="Delete"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger icon={<DeleteOutlined />} type="text" />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={
                  <div className="template-title">
                    <Text strong>{template.name}</Text>
                    {template.isDefault && (
                      <Tag color="gold" className="default-tag">
                        Default
                      </Tag>
                    )}
                  </div>
                }
                description={
                  <div className="template-preview">
                    <Text type="secondary" className="subject-line">
                      Subject: {template.subject}
                    </Text>
                    <Paragraph
                      ellipsis={{ rows: 2 }}
                      className="body-preview"
                      type="secondary"
                    >
                      {template.body.replace(/<[^>]*>/g, "")}
                    </Paragraph>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
};

export default SavedTemplatesModal;
