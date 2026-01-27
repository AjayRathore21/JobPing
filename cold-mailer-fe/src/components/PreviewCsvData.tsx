import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Typography,
  Spin,
  Alert,
  Table,
  Space,
  Checkbox,
  InputNumber,
  message,
  Tooltip,
  Grid,
  Tag,
} from "antd";
import { MailOutlined, SendOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useUserStore } from "../store/userStore";
import AuthRestrictionModal from "./AuthRestrictionModal";
import "./PreviewCsv.scss";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface CsvRecord {
  _id: string;
  name: string;
  url: string;
  totalRecords: number;
  sent: number;
  uploadedAt: string;
  sentEmailRowIds?: string[];
  failedEmailRowIds?: string[];
}

interface PreviewCsvDataProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCsv: CsvRecord | null;
  modalLoading: boolean;
  previewData: string[][];
  previewHeaders: string[];
  onSendEmail: (params: {
    mode: "selected" | "range" | "bulk";
    rowIds?: string[];
    range?: { start: number; end: number };
  }) => Promise<void>;
  sendingEmail: boolean;
}

const PreviewCsvData = ({
  isOpen,
  onClose,
  selectedCsv,
  modalLoading,
  previewData,
  previewHeaders,
  onSendEmail,
  sendingEmail,
}: PreviewCsvDataProps) => {
  const screens = useBreakpoint();
  // Row selection state
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [startIndex, setStartIndex] = useState<number | null>(1);
  const [endIndex, setEndIndex] = useState<number | null>(5);
  const [selectionMode, setSelectionMode] = useState<
    "selected" | "range" | "bulk"
  >("bulk");
  const [resendingKey, setResendingKey] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const user = useUserStore((state) => state.user);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedRowKeys([]);
      setStartIndex(1);
      setEndIndex(5);
      setSelectionMode("bulk");
      setResendingKey(null);
    }
  }, [isOpen]);

  const getRowStatus = (record: Record<string, string>) => {
    const key = record.key;
    const isSentPersistent = selectedCsv?.sentEmailRowIds?.includes(key);
    const isFailedPersistent = selectedCsv?.failedEmailRowIds?.includes(key);

    const isSent = isSentPersistent;
    const isFailed = isFailedPersistent;

    // Check if opened
    const isOpened = !!user?.openedEmails?.find(
      (oe) => oe.csvId === selectedCsv?._id && String(oe.rowId) === String(key),
    );

    return { isSent, isFailed, isOpened };
  };

  // Transform data rows into objects for the table
  const previewTableData = previewData.map((row) => {
    const rowObj: Record<string, string> = {};

    row.forEach((cell, cellIndex) => {
      rowObj[previewHeaders[cellIndex]] = cell;
    });

    const key = rowObj[previewHeaders[0]];
    rowObj.key = key;
    return rowObj;
  });

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRowKeys.length === previewData.length) {
      setSelectedRowKeys([]);
      setSelectionMode("bulk");
    } else {
      const keys = previewTableData.map((row) => row.key);
      setSelectedRowKeys(keys);
      setSelectionMode("selected");
    }
  };

  // Handle range selection
  const handleApplyRange = () => {
    if (startIndex !== null && endIndex !== null) {
      const start = startIndex - 1;
      const end = endIndex - 1;

      if (start <= end && start >= 0 && end < previewTableData.length) {
        const keys: React.Key[] = [];
        for (let i = start; i <= end; i++) {
          const row = previewTableData[i];
          keys.push(row.key);
        }
        setSelectedRowKeys(keys);
        setSelectionMode("range");
      } else {
        message.error("Invalid range indices");
      }
    }
  };

  const handleSingleSend = async (key: string) => {
    if (!user?.googleId) {
      setIsAuthModalOpen(true);
      return;
    }
    setResendingKey(key);
    await onSendEmail({ mode: "selected", rowIds: [key] });
    setResendingKey(null);
  };

  // Handle send email (Bulk/Range/Multi)
  const handleSendEmail = async () => {
    if (!user?.googleId) {
      setIsAuthModalOpen(true);
      return;
    }
    if (selectedRowKeys.length > 0) {
      if (
        selectionMode === "range" &&
        startIndex !== null &&
        endIndex !== null
      ) {
        await onSendEmail({
          mode: "range",
          range: { start: startIndex, end: endIndex },
        });
      } else {
        await onSendEmail({
          mode: "selected",
          rowIds: selectedRowKeys.map((k) => String(k)),
        });
      }
    } else {
      await onSendEmail({ mode: "bulk" });
    }
  };

  // Row selection config
  const rowSelection = {
    selectedRowKeys,
    hideSelectAll: true,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
      setSelectionMode(newSelectedRowKeys.length > 0 ? "selected" : "bulk");
    },
  };

  const previewColumns: ColumnsType<Record<string, string>> = [
    ...previewHeaders
      .filter((header) => header.toLowerCase() !== "id")
      .map((header) => {
        const h = header.toLowerCase();
        let width = 120;
        if (h.includes("email")) width = 220;
        if (h.includes("name")) width = 150;
        if (h.includes("company")) width = 180;

        return {
          title: header,
          dataIndex: header,
          key: header,
          ellipsis: true,
          width,
        };
      }),
    {
      title: "Status",
      key: "status",
      width: 100,
      render: (_, record: Record<string, string>) => {
        const { isSent, isOpened } = getRowStatus(record);

        if (isOpened) {
          return (
            <Tag
              color="success"
              style={{ borderRadius: "100px", padding: "0 12px" }}
            >
              Opened
            </Tag>
          );
        }

        if (isSent) {
          return (
            <Tag
              color="processing"
              style={{ borderRadius: "100px", padding: "0 12px" }}
            >
              Sent
            </Tag>
          );
        }

        return (
          <Tag style={{ borderRadius: "100px", padding: "0 12px" }}>Draft</Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: screens.xs ? 70 : 110,
      render: (_, record: Record<string, string>) => {
        const key = record.key;
        const { isSent, isFailed } = getRowStatus(record);

        return (
          <Space size="small">
            {!isSent && !isFailed && (
              <Tooltip title="Send Email">
                <Button
                  size="small"
                  type="primary"
                  shape="circle"
                  icon={<MailOutlined />}
                  onClick={() => handleSingleSend(key)}
                  loading={resendingKey === key}
                />
              </Tooltip>
            )}
            {isSent && (
              <Tooltip title="Resend Email">
                <Button
                  size="small"
                  shape="circle"
                  icon={<SendOutlined />}
                  onClick={() => handleSingleSend(key)}
                  loading={resendingKey === key}
                />
              </Tooltip>
            )}
            {isFailed && (
              <Tooltip title="Retry Failed Email">
                <Button
                  size="small"
                  type="primary"
                  ghost
                  shape="circle"
                  icon={<ReloadOutlined />}
                  onClick={() => handleSingleSend(key)}
                  loading={resendingKey === key}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Modal
      key={selectedCsv?._id}
      title={
        <div className="preview-modal-header">
          <Title level={4} className="preview-modal-title">
            {selectedCsv?.name}
          </Title>
          <Text type="secondary">
            Review records and select distribution mode below.
          </Text>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose} size="large" shape="round">
          Cancel
        </Button>,
        <Button
          key="send"
          type="primary"
          onClick={handleSendEmail}
          loading={sendingEmail}
          size="large"
          shape="round"
          icon={<SendOutlined />}
          className="send-btn-pd"
        >
          {selectedRowKeys.length > 0
            ? `Send to ${selectedRowKeys.length} Selected`
            : "Send to All Records"}
        </Button>,
      ]}
      width={screens.xs ? "95%" : 1200}
      className="modern-modal csv-preview-modal"
      centered
    >
      {modalLoading ? (
        <div className="loading-container">
          <Spin size="large" />
          <div className="parsing-text">
            <Text type="secondary">Parsing your data...</Text>
          </div>
        </div>
      ) : previewData.length > 0 ? (
        <div className="modal-inner-content">
          <div className="selection-bar glass-card">
            <Space wrap size="large" className="selection-bar-space">
              <Checkbox
                checked={
                  selectedRowKeys.length === previewData.length &&
                  previewData.length > 0
                }
                onChange={handleSelectAll}
                className="modern-checkbox"
              >
                Select All ({previewData.length})
              </Checkbox>

              <div className="range-controls">
                <Space wrap>
                  <Text strong className="filter-range-label">
                    Filter Range:
                  </Text>
                  <InputNumber
                    min={1}
                    max={previewData.length}
                    value={startIndex}
                    onChange={(value) => setStartIndex(value)}
                    className="modern-input-number"
                  />
                  <Text>to</Text>
                  <InputNumber
                    min={1}
                    max={previewData.length}
                    value={endIndex}
                    onChange={(value) => setEndIndex(value)}
                    className="modern-input-number"
                  />
                  <Button
                    onClick={handleApplyRange}
                    shape="round"
                    type="default"
                    className="range-apply-btn"
                  >
                    Apply
                  </Button>
                </Space>
              </div>
            </Space>
          </div>

          <div className="table-wrapper">
            <Table
              dataSource={previewTableData}
              columns={previewColumns}
              rowKey="key"
              rowSelection={rowSelection}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              scroll={{ x: true, y: 500 }}
              size="middle"
              className="custom-table"
              rowClassName={(record) => {
                const { isSent, isFailed } = getRowStatus(record);
                if (isSent) return "row-sent";
                if (isFailed) return "row-failed";
                return "";
              }}
            />
          </div>
        </div>
      ) : (
        <Alert
          message="This CSV file seems to be empty or misformatted."
          type="warning"
          showIcon
        />
      )}
      <AuthRestrictionModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        type="GOOGLE_AUTH_REQUIRED"
      />
    </Modal>
  );
};

export default PreviewCsvData;
