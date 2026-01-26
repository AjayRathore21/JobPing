import React from "react";
import { Modal, List, Typography, Button, Space } from "antd";
import {
  WarningOutlined,
  EditOutlined,
  TableOutlined,
} from "@ant-design/icons";
import "./MissingVariablesModal.scss";

const { Text, Paragraph, Title } = Typography;

interface MissingVariablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingVariables: string[];
}

const MissingVariablesModal: React.FC<MissingVariablesModalProps> = ({
  isOpen,
  onClose,
  missingVariables,
}) => {
  return (
    <Modal
      title={
        <Space>
          <WarningOutlined className="warning-icon" />
          <span>Unmatched Dynamic Variables</span>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose} shape="round">
          Got it, let me fix it
        </Button>,
      ]}
      centered
      width={500}
      className="missing-variables-modal"
    >
      <div className="modal-content">
        <Paragraph>
          The following dynamic variables in your template do not match any
          headers in your recipient data:
        </Paragraph>
        <List
          size="small"
          bordered
          dataSource={missingVariables}
          renderItem={(item) => (
            <List.Item>
              <code className="variable-code">
                {"{{"}
                {item}
                {"}}"}
              </code>
            </List.Item>
          )}
          className="variable-list"
        />
      </div>

      <div className="fix-instructions">
        <Title level={5} className="instructions-title">
          How to fix:
        </Title>
        <div className="instruction-item">
          <EditOutlined className="instruction-icon edit-icon" />
          <div className="instruction-text">
            <Text strong className="option-title">
              Option 1: Correct the Template
            </Text>
            <Text type="secondary" className="option-description">
              Update the variable names in your email body or subject to match
              the CSV headers exactly.
            </Text>
          </div>
        </div>
        <div className="instruction-item">
          <TableOutlined className="instruction-icon table-icon" />
          <div className="instruction-text">
            <Text strong className="option-title">
              Option 2: Update Recipient Data
            </Text>
            <Text type="secondary" className="option-description">
              Upload a new CSV file that includes the missing header columns.
            </Text>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MissingVariablesModal;
