import { useEffect, useState } from "react";
import {
  Table,
  Typography,
  Spin,
  Alert,
  Modal,
  Button,
  InputNumber,
  Space,
  Checkbox,
  message,
  Tooltip,
} from "antd";
import {
  MailOutlined,
  EyeOutlined,
  DeleteOutlined,
  SendOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import axios from "../configs/axiosConfig";
import Papa from "papaparse";
import { useUserStore } from "../store/userStore";

const { Title, Text } = Typography;

interface CsvRecord {
  _id: string;
  name: string;
  url: string;
  totalRecords: number;
  sent: number;
  uploadedAt: string;
}

const PreviewCsv = () => {
  const [csvs, setCsvs] = useState<CsvRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [selectedCsv, setSelectedCsv] = useState<CsvRecord | null>(null);

  // Row selection state
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [, setSelectedRows] = useState<Record<string, string>[]>([]);
  const [startIndex, setStartIndex] = useState<number | null>(null);
  const [endIndex, setEndIndex] = useState<number | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchCsvs();
  }, []);

  const fetchCsvs = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/upload/csv");
      setCsvs(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching CSVs:", err);
      setError("Failed to load uploaded files");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCsv = async (id: string) => {
    try {
      await axios.delete(`/upload/csv/${id}`);
      setCsvs(csvs.filter((c) => c._id !== id));
      message.success("CSV deleted successfully");
    } catch (err) {
      console.error("Error deleting CSV:", err);
      message.error("Failed to delete CSV");
    }
  };

  const handlePreviewClick = async (record: CsvRecord) => {
    setSelectedCsv(record);
    setIsModalOpen(true);
    setModalLoading(true);
    setPreviewData([]);
    setPreviewHeaders([]);
    setSelectedRowKeys([]);
    setSelectedRows([]);
    setStartIndex(null);
    setEndIndex(null);

    try {
      // Fetch and parse CSV content from the stored URL
      const response = await fetch(record.url);
      const csvText = await response.text();

      Papa.parse(csvText, {
        complete: (results) => {
          const data = results.data as string[][];
          if (data.length > 0) {
            setPreviewHeaders(data[0]);
            setPreviewData(
              data.slice(1).filter((row) => row.some((cell) => cell)) // remove header used for column name
            );
          }
          setModalLoading(false);
        },
        error: (err: Error) => {
          console.error("CSV parsing error:", err);
          setModalLoading(false);
        },
      });
    } catch (err) {
      console.error("Error fetching CSV for preview:", err);
      setModalLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setPreviewData([]);
    setPreviewHeaders([]);
    setSelectedCsv(null);
    setSelectedRowKeys([]);
    setSelectedRows([]);
    setStartIndex(null);
    setEndIndex(null);
  };

  const idIndex = previewHeaders.findIndex((h) => h.toLowerCase() === "id");

  // Transform data rows into objects for the table
  const previewTableData = previewData.map((row, rowIndex) => {
    const key = idIndex !== -1 ? row[idIndex] : String(rowIndex);
    const rowObj: Record<string, string> = { key };
    row.forEach((cell, cellIndex) => {
      rowObj[`col_${cellIndex}`] = cell;
    });
    return rowObj;
  });

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRowKeys.length === previewData.length) {
      setSelectedRowKeys([]);
      setSelectedRows([]);
    } else {
      const keys = previewData.map((row, rowIndex) =>
        idIndex !== -1 ? row[idIndex] : String(rowIndex)
      );
      setSelectedRowKeys(keys);
      setSelectedRows(previewTableData);
    }
  };

  // Handle range selection
  const handleApplyRange = () => {
    if (startIndex !== null && endIndex !== null) {
      const start = startIndex - 1; // preview data is 0 index based
      const end = endIndex - 1;

      if (start <= end) {
        const keys: React.Key[] = [];
        const rows: Record<string, string>[] = [];
        for (let i = start; i <= end; i++) {
          const key = idIndex !== -1 ? previewData[i][idIndex] : String(i);
          keys.push(key);
          rows.push(previewTableData[i]);
        }
        setSelectedRowKeys(keys);
        setSelectedRows(rows);
      } else {
        message.error("Start index must be less than or equal to end index");
      }
    }
  };

  const handleDeleteRow = (key: string) => {
    const newData = previewData.filter((row, rowIndex) => {
      const rowKey = idIndex !== -1 ? row[idIndex] : String(rowIndex);
      return rowKey !== key;
    });
    setPreviewData(newData);
    setSelectedRowKeys(selectedRowKeys.filter((k) => k !== key));
    message.success("Row removed from preview");
  };

  const [resendingKey, setResendingKey] = useState<string | null>(null);

  const handleSingleSend = async (key: string) => {
    if (!emailSubject || !emailHtml) {
      message.warning(
        "Please provide an email subject and content in the Dashboard first."
      );
      return;
    }

    setResendingKey(key);
    try {
      const payload = {
        csvId: selectedCsv?._id,
        subject: emailSubject,
        html: emailHtml,
        selectedRows: [key],
      };

      await axios.post("/send-email", payload);
      message.success("Email sent successfully!");
    } catch (err) {
      console.error("Error sending single email:", err);
      message.error("Failed to send email");
    } finally {
      setResendingKey(null);
    }
  };

  const emailSubject = useUserStore((state) => state.emailSubject);
  const emailHtml = useUserStore((state) => state.emailHtml);

  // Handle send email
  const handleSendEmail = async () => {
    if (!emailSubject || !emailHtml) {
      message.warning(
        "Please provide an email subject and content in the Dashboard first."
      );
      return;
    }

    setSendingEmail(true);
    try {
      const payload: {
        csvId: string | undefined;
        subject: string;
        html: string;
        selectedRows?: React.Key[];
      } = {
        csvId: selectedCsv?._id,
        subject: emailSubject,
        html: emailHtml,
      };

      if (selectedRowKeys.length > 0) {
        payload.selectedRows = selectedRowKeys;
      } else {
        // If no specific rows are selected, the backend should process all rows for the given csvId.
        // No 'selectedRows' parameter is sent in this case.
        message.info("Sending emails to all rows in the CSV.");
      }

      const response = await axios.post("/send-email", payload);
      message.success("Emails sent successfully!");
      console.log("Send email response:", response.data);
    } catch (err) {
      console.error("Error sending emails:", err);
      message.error("Failed to send emails");
    } finally {
      setSendingEmail(false);
    }
  };

  // Row selection config
  const rowSelection = {
    selectedRowKeys,
    hideSelectAll: true,
    onChange: (
      newSelectedRowKeys: React.Key[],
      newSelectedRows: Record<string, string>[]
    ) => {
      setSelectedRowKeys(newSelectedRowKeys);
      setSelectedRows(newSelectedRows);
    },
  };

  const previewColumns: ColumnsType<Record<string, string>> = [
    ...previewHeaders
      .map((header, index) => ({
        title: header,
        dataIndex: `col_${index}`,
        key: `col_${index}`,
        ellipsis: true,
      }))
      .filter((col) => col.title.toLowerCase() !== "id"),
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 250,
      render: (_, record: Record<string, string>) => {
        const key = record.key;
        // Check if there's a status column that indicates failure
        const hasFailed = Object.entries(record).some(
          ([k, v]) =>
            k.includes("col_") &&
            typeof v === "string" &&
            (v.toLowerCase().includes("failed") ||
              v.toLowerCase().includes("error"))
        );

        return (
          <Space size="small">
            <Tooltip title="Resend Email">
              <Button
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleSingleSend(key)}
                loading={resendingKey === key}
              />
            </Tooltip>
            {hasFailed && (
              <Tooltip title="Retry Failed Email">
                <Button
                  size="small"
                  type="primary"
                  ghost
                  icon={<ReloadOutlined />}
                  onClick={() => handleSingleSend(key)}
                  loading={resendingKey === key}
                />
              </Tooltip>
            )}
            <Tooltip title="Delete Row">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteRow(key)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  const columns: ColumnsType<CsvRecord> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: CsvRecord) => (
        <Button
          type="link"
          onClick={() => handlePreviewClick(record)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: "Upload Date",
      dataIndex: "uploadedAt",
      key: "uploadedAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Total Records",
      dataIndex: "totalRecords",
      key: "totalRecords",
    },
    {
      title: "Sent",
      dataIndex: "sent",
      key: "sent",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record: CsvRecord) => (
        <Space size="small">
          <Tooltip title="Preview Content">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handlePreviewClick(record)}
            />
          </Tooltip>
          <Tooltip title="Delete CSV">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteCsv(record._id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert message={error} type="error" showIcon />;
  }

  return (
    <div style={{ marginTop: "32px" }}>
      <Table
        dataSource={csvs}
        columns={columns}
        rowKey="_id"
        locale={{ emptyText: "No CSV files uploaded yet" }}
        pagination={{ pageSize: 10 }}
        className="custom-table"
        style={{ background: "#fff", borderRadius: "12px", overflow: "hidden" }}
      />

      <Modal
        title={
          <div style={{ padding: "16px 0" }}>
            <Title level={4} style={{ margin: 0 }}>
              Preview: {selectedCsv?.name}
            </Title>
            <Text type="secondary">
              Review and select records for your outreach
            </Text>
          </div>
        }
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={[
          <Button key="back" onClick={handleModalClose} size="large">
            Cancel
          </Button>,
          <Button
            key="send"
            type="primary"
            onClick={handleSendEmail}
            loading={sendingEmail}
            size="large"
            icon={<MailOutlined />}
            style={{ minWidth: "160px" }}
          >
            Send Emails Now
          </Button>,
        ]}
        width={1100}
        styles={{
          body: { maxHeight: "70vh", overflow: "auto", padding: "0 24px 24px" },
          header: { borderBottom: "1px solid #f1f5f9", marginBottom: "24px" },
        }}
        centered
      >
        {modalLoading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Spin size="large" />
            <Typography.Text style={{ display: "block", marginTop: 16 }}>
              Loading CSV...
            </Typography.Text>
          </div>
        ) : previewData.length > 0 ? (
          <>
            {/* Selection Controls */}
            <div
              style={{
                marginBottom: 16,
                padding: 16,
                background: "#f5f5f5",
                borderRadius: 8,
              }}
            >
              <Space wrap>
                <Checkbox
                  checked={
                    selectedRowKeys.length === previewData.length &&
                    previewData.length > 0
                  }
                  onChange={handleSelectAll}
                >
                  Select All
                </Checkbox>

                <span style={{ marginLeft: 16 }}>|</span>

                <Space>
                  <Typography.Text>Start Index:</Typography.Text>
                  <InputNumber
                    min={1}
                    max={previewData.length}
                    value={startIndex}
                    onChange={(value) => setStartIndex(value)}
                    placeholder="1"
                    style={{ width: 80 }}
                  />
                </Space>

                <Space>
                  <Typography.Text>End Index:</Typography.Text>
                  <InputNumber
                    min={1}
                    max={previewData.length}
                    value={endIndex}
                    onChange={(value) => setEndIndex(value)}
                    placeholder={String(previewData.length)}
                    style={{ width: 80 }}
                  />
                </Space>

                <Button onClick={handleApplyRange} size="small" type="default">
                  Apply Range
                </Button>

                <Typography.Text type="secondary">
                  ({previewData.length} total rows)
                </Typography.Text>
              </Space>
            </div>

            <Table
              dataSource={previewTableData}
              columns={previewColumns}
              rowKey="key"
              rowSelection={rowSelection}
              pagination={{ pageSize: 10 }}
              scroll={{ x: true }}
              size="small"
            />
          </>
        ) : (
          <Alert message="No data found in CSV file" type="info" showIcon />
        )}
      </Modal>
    </div>
  );
};

export default PreviewCsv;
