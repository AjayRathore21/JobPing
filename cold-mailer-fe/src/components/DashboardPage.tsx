import React, { useRef, useState } from "react";
import {
  Button,
  Space,
  Card,
  Typography,
  Upload,
  message,
  Divider,
} from "antd";
import { InboxOutlined, UploadOutlined } from "@ant-design/icons";
import PreviewCsv from "./PreviewCsv";
import axios from "../configs/axiosConfig";

const { Title, Text } = Typography;
const { Dragger } = Upload;

const DashboardPage = () => {
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

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
      .then((res) => {
        message.success("File uploaded successfully");
        setFileList([]);
        // We might want to trigger a refresh for PreviewCsv here if it had a refresh method
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
        <Button
          type="primary"
          icon={<UploadOutlined />}
          size="large"
          onClick={handleUpload}
          loading={uploading}
          disabled={fileList.length === 0}
        >
          Push Data to Cloud
        </Button>
      </div>

      <Card
        bordered={false}
        style={{
          marginBottom: "32px",
          background: "#f8fafc",
          border: "1px dashed #cbd5e1",
        }}
      >
        <Dragger
          {...uploadProps}
          style={{ background: "transparent", border: "none" }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ color: "#1890ff" }} />
          </p>
          <p className="ant-upload-text">
            Click or drag CSV file to this area to upload
          </p>
          <p className="ant-upload-hint">
            Support for a single upload. Data will be processed and indexed for
            your campaigns.
          </p>
        </Dragger>
      </Card>

      <Divider />

      <Title level={4} style={{ marginBottom: "24px" }}>
        Data Overview
      </Title>
      <PreviewCsv />
    </div>
  );
};

export default DashboardPage;
