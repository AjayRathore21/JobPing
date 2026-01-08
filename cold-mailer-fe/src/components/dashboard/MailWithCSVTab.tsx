import { useState } from "react";
import {
  Button,
  Card,
  Upload,
  message,
  Space,
  Row,
  Col,
  Input,
  Typography,
  Grid,
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
const { useBreakpoint } = Grid;

interface MailWithCSVTabProps {
  setIsPreviewOpen: (open: boolean) => void;
}

const MailWithCSVTab: React.FC<MailWithCSVTabProps> = ({
  setIsPreviewOpen,
}) => {
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const screens = useBreakpoint();

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
      <Row gutter={[24, 24]} className="dashboard-cards">
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <UploadOutlined />
                <span>Upload Contacts</span>
              </Space>
            }
            bordered={false}
            className="dashboard-card"
          >
            <Dragger {...uploadProps} className="dragger-container">
              <p className="ant-upload-drag-icon">
                <InboxOutlined className="dragger-icon" />
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
                className="upload-btn"
              >
                Upload CSV
              </Button>
            </Dragger>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <EditOutlined />
                <span>Email Content Editor</span>
              </Space>
            }
            bordered={false}
            className="dashboard-card"
            extra={
              <Button
                icon={<EyeOutlined />}
                onClick={() => setIsPreviewOpen(true)}
                disabled={!emailHtml}
              >
                {!screens.xs && "Preview"}
              </Button>
            }
          >
            <Space direction="vertical" className="editor-space" size="middle">
              <div>
                <Text strong>Email Subject</Text>
                <Input
                  placeholder="Enter email subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="subject-input"
                />
              </div>
              <div>
                <Text strong>HTML Layout / Message</Text>
                <TextArea
                  placeholder="Enter HTML content or plain text..."
                  rows={6}
                  value={emailHtml}
                  onChange={(e) => setEmailHtml(e.target.value)}
                  className="html-editor"
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Title level={4} className="section-title">
        CSV Data Overview
      </Title>
      <PreviewCsv />
    </div>
  );
};

export default MailWithCSVTab;
