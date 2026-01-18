import React from "react";
import { Modal, Button, Typography, Space } from "antd";
import {
  GoogleOutlined,
  InfoCircleOutlined,
  LockOutlined,
} from "@ant-design/icons";
import "./AuthRestrictionModal.scss";

const { Title, Text } = Typography;

interface AuthRestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "TEST_MODE" | "GOOGLE_AUTH_REQUIRED";
  onProceed?: () => void;
}

const AuthRestrictionModal: React.FC<AuthRestrictionModalProps> = ({
  isOpen,
  onClose,
  type,
  onProceed,
}) => {
  const content = {
    TEST_MODE: {
      title: "Google Login Required",
      icon: <InfoCircleOutlined className="modal-icon-info" />,
      message: (
        <>
          <Text className="modal-text">
            ✉️ To send emails on your behalf, you must log in using Google and
            grant the “Send email on my behalf” permission.
          </Text>
          <Text className="modal-text mt-sm">
            This feature requires Google OAuth verification, which includes a
            verified domain and legal documents. Since this is a personal
            project, the app is currently running in testing mode.
          </Text>
          <Text className="modal-text mt-sm">
            Normal login is provided for exploration purposes only.
          </Text>
        </>
      ),
      buttonText: "Proceed anyway",
      buttonIcon: <GoogleOutlined />,
    },
    GOOGLE_AUTH_REQUIRED: {
      title: "Google Authentication Required",
      icon: <LockOutlined className="modal-icon-lock" />,
      message: (
        <>
          <Text className="modal-text">
            ✉️ To send emails on your behalf, you must log in using Google and
            grant the “Send email on my behalf” permission.
          </Text>
          <Text className="modal-text mt-sm">
            Normal login is provided for exploration purposes only.
          </Text>
        </>
      ),
      buttonText: "I Understand",
      buttonIcon: null,
    },
  }[type];

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      className="auth-restriction-modal modern-modal"
      width={450}
    >
      <div className="modal-content-wrapper">
        <div className="icon-badge-large">{content.icon}</div>
        <Title level={3} className="modal-title">
          {content.title}
        </Title>
        <div className="modal-message-container">{content.message}</div>
        <Space direction="vertical" className="modal-footer-space">
          <Button
            type="primary"
            size="large"
            block
            shape="round"
            icon={content.buttonIcon}
            onClick={() => {
              if (onProceed) onProceed();
              onClose();
            }}
            className="modal-action-btn"
          >
            {content.buttonText}
          </Button>
          <Button
            type="text"
            size="large"
            block
            onClick={onClose}
            className="modal-cancel-btn"
          >
            Cancel
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default AuthRestrictionModal;
