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
} from "antd";
import { MailOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import axios from "../configs/axiosConfig";
import Papa from "papaparse";

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
              data.slice(1).filter((row) => row.some((cell) => cell))
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

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRowKeys.length === previewData.length) {
      setSelectedRowKeys([]);
      setSelectedRows([]);
    } else {
      setSelectedRowKeys(previewData.map((_, index) => String(index)));
      // Convert all data to row objects
      const allRows = previewData.map((row, rowIndex) => {
        const rowObj: Record<string, string> = { key: String(rowIndex) };
        row.forEach((cell, cellIndex) => {
          rowObj[`col_${cellIndex}`] = cell;
        });
        return rowObj;
      });
      setSelectedRows(allRows);
    }
  };

  // Apply range selection based on start/end index
  const handleApplyRange = () => {
    if (startIndex !== null && endIndex !== null) {
      const start = Math.max(0, startIndex - 1); // Convert to 0-based
      const end = Math.min(previewData.length - 1, endIndex - 1);

      if (start <= end) {
        const keys: React.Key[] = [];
        const rows: Record<string, string>[] = [];
        for (let i = start; i <= end; i++) {
          keys.push(String(i));
          const rowObj: Record<string, string> = { key: String(i) };
          previewData[i].forEach((cell, cellIndex) => {
            rowObj[`col_${cellIndex}`] = cell;
          });
          rows.push(rowObj);
        }
        setSelectedRowKeys(keys);
        setSelectedRows(rows);
      } else {
        message.error("Start index must be less than or equal to end index");
      }
    }
  };

  // Handle send email
  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const payload: Record<string, any> = {
        csvId: selectedCsv?._id,
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
    onChange: (
      newSelectedRowKeys: React.Key[],
      newSelectedRows: Record<string, string>[]
    ) => {
      setSelectedRowKeys(newSelectedRowKeys);
      setSelectedRows(newSelectedRows);
    },
  };

  // Generate columns for preview table
  const previewColumns: ColumnsType<Record<string, string>> = previewHeaders
    .map((header, index) => ({
      title: header,
      dataIndex: `col_${index}`,
      key: `col_${index}`,
      ellipsis: true,
    }))
    .filter((col) => col.title !== "id");

  // Transform data rows into objects for the table
  const previewTableData = previewData.map((row, rowIndex) => {
    const rowObj: Record<string, string> = { key: String(rowIndex) };
    row.forEach((cell, cellIndex) => {
      rowObj[`col_${cellIndex}`] = cell;
    });
    return rowObj;
  });

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
                  indeterminate={
                    selectedRowKeys.length > 0 &&
                    selectedRowKeys.length < previewData.length
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
