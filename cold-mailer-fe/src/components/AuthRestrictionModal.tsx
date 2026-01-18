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
      title: "Google App in Testing Mode",
      icon: <InfoCircleOutlined className="modal-icon-info" />,
      message: (
        <>
          <Text className="modal-text">
            This is a personal project, and the Google app is currently running
            in <strong>testing mode</strong> due to Google OAuth publishing
            requirements.
          </Text>
          <Text className="modal-text mt-sm">
            Publishing a Google app that uses sensitive scopes (such as sending
            emails on behalf of a user) requires a verified domain, Privacy
            Policy, Terms & Conditions, and completion of Google's OAuth
            verification process. For a self-funded personal project, this
            involves additional cost and overhead.
          </Text>
          <Text className="modal-text mt-sm">
            💬 If you'd like to use this app, please{" "}
            <a
              href="https://www.linkedin.com/in/ajay-rathore-5a99aa195/"
              target="_blank"
              rel="noopener noreferrer"
            >
              DM me on LinkedIn
            </a>
            —I'll add you as a test user, and you'll get full access free of
            cost.
          </Text>
        </>
      ),
      buttonText: "Continue to App",
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
