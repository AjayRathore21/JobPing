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
  sentEmailRowIds?: string[];
  failedEmailRowIds?: string[];
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
  const [startIndex, setStartIndex] = useState<number | null>(1);
  const [endIndex, setEndIndex] = useState<number | null>(5);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [selectionMode, setSelectionMode] = useState<
    "selected" | "range" | "bulk"
  >("bulk");

  console.log("this is selected row keys", selectedRowKeys);

  useEffect(() => {
    fetchCsvs();
  }, []);

  // Sync selectedCsv with updated metadata from csvs list
  useEffect(() => {
    if (selectedCsv) {
      const updated = csvs.find((c) => c._id === selectedCsv._id);
      if (updated) {
        setSelectedCsv(updated);
      }
    }
  }, [csvs, selectedCsv]);

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
    setStartIndex(1);
    setEndIndex(5); // Default as per user's preference
    setSelectionMode("bulk");

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
    setSelectionMode("bulk");
  };

  // Transform data rows into objects for the table
  const previewTableData = previewData.map((row) => {
    const rowObj: Record<string, string> = {};

    row.forEach((cell, cellIndex) => {
      rowObj[previewHeaders[cellIndex]] = cell;
    });

    // Find "id" column case-insensitively for the key or use the first column as per user's latest change
    const key = rowObj[previewHeaders[0]];

    rowObj.key = key;
    return rowObj;
  });

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRowKeys.length === previewData.length) {
      setSelectedRowKeys([]);
      setSelectedRows([]);
      setSelectionMode("bulk");
    } else {
      const keys = previewTableData.map((row) => row.key);
      setSelectedRowKeys(keys);
      setSelectedRows(previewTableData);
      setSelectionMode("selected");
    }
  };

  // Handle range selection
  const handleApplyRange = () => {
    if (startIndex !== null && endIndex !== null) {
      const start = startIndex - 1; // preview data is 0 index based
      const end = endIndex - 1;

      if (start <= end && start >= 0 && end < previewTableData.length) {
        const keys: React.Key[] = [];
        const rows: Record<string, string>[] = [];
        for (let i = start; i <= end; i++) {
          const row = previewTableData[i];
          keys.push(row.key);
          rows.push(row);
        }
        setSelectedRowKeys(keys);
        setSelectedRows(rows);
        setSelectionMode("range");
      } else {
        message.error("Invalid range indices");
      }
    }
  };

  // const handleDeleteRow = (key: string) => {
  //   const indexToDelete = previewTableData.findIndex((row) => row.key === key);
  //   if (indexToDelete !== -1) {
  //     const newData = previewData.filter((_, index) => index !== indexToDelete);
  //     setPreviewData(newData);
  //     setSelectedRowKeys(selectedRowKeys.filter((k) => k !== key));
  //     // Reset mode if empty or just keep multi
  //     if (selectedRowKeys.length <= 1) setSelectionMode("bulk");
  //     message.success("Row removed from preview");
  //   }
  // };

  const [resendingKey, setResendingKey] = useState<string | null>(null);

  const executeEmailSend = async (params: {
    mode: "selected" | "range" | "bulk";
    rowIds?: string[];
    range?: { start: number; end: number };
  }) => {
    if (params.mode === "selected" && params.rowIds?.length === 1) {
      setResendingKey(params.rowIds[0]);
    } else {
      setSendingEmail(true);
    }

    try {
      const payload = {
        csvId: selectedCsv?._id,
        subject: emailSubject,
        html: emailHtml,
        ...params,
      };

      if (params.mode === "range" && params.range) {
        message.info(
          `Sending emails to rows ${params.range.start} to ${params.range.end}.`
        );
      } else if (params.mode === "selected" && params.rowIds) {
        if (params.rowIds.length > 1) {
          message.info(
            `Sending emails to ${params.rowIds.length} selected rows.`
          );
        }
      } else {
        message.info("Sending emails to all rows in the CSV.");
      }

      await axios.post("/send-email", payload);
      message.success("Email process started successfully!");
      fetchCsvs();
    } catch (err) {
      console.error("Error sending email:", err);
      message.error("Failed to send email");
    } finally {
      setResendingKey(null);
      setSendingEmail(false);
    }
  };

  const handleSingleSend = async (key: string) => {
    await executeEmailSend({ mode: "selected", rowIds: [key] });
  };

  const emailSubject = useUserStore((state) => state.emailSubject);
  const emailHtml = useUserStore((state) => state.emailHtml);

  // Handle send email (Bulk/Range/Multi)
  const handleSendEmail = async () => {
    if (selectedRowKeys.length > 0) {
      if (
        selectionMode === "range" &&
        startIndex !== null &&
        endIndex !== null
      ) {
        await executeEmailSend({
          mode: "range",
          range: { start: startIndex, end: endIndex },
        });
      } else {
        await executeEmailSend({
          mode: "selected",
          rowIds: selectedRowKeys.map((k) => String(k)),
        });
      }
    } else {
      await executeEmailSend({ mode: "bulk" });
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
      setSelectionMode(newSelectedRowKeys.length > 0 ? "selected" : "bulk");
    },
  };

  const previewColumns: ColumnsType<Record<string, string>> = [
    ...previewHeaders
      .filter((header) => header.toLowerCase() !== "id")
      .map((header) => ({
        title: header,
        dataIndex: header,
        key: header,
        ellipsis: true,
      })),
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 250,
      render: (_, record: Record<string, string>) => {
        const key = record.key;
        // Check persistent IDs from the selectedCsv metadata
        const isSentPersistent = selectedCsv?.sentEmailRowIds?.includes(key);
        const isFailedPersistent =
          selectedCsv?.failedEmailRowIds?.includes(key);

        // Get status value from the record if status column exists (fallback)
        let csvStatus = "";
        const statusColumn = previewHeaders.find(
          (h) => h.toLowerCase() === "status"
        );
        if (statusColumn) {
          csvStatus = record[statusColumn]?.toLowerCase() || "";
        }

        const isSent = isSentPersistent || csvStatus === "sent";
        const isFailed =
          isFailedPersistent || csvStatus === "failed" || csvStatus === "error";

        return (
          <Space size="small">
            {!isSent && !isFailed && (
              <Tooltip title="Send Email">
                <Button
                  size="small"
                  type="primary"
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
                  icon={<ReloadOutlined />}
                  onClick={() => handleSingleSend(key)}
                  loading={resendingKey === key}
                />
              </Tooltip>
            )}
            {/* <Tooltip title="Delete Row">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteRow(key)}
              />
            </Tooltip> */}
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
