import { useEffect, useState } from "react";
import { Table, Spin, Alert, Button, message, Tooltip, Space } from "antd";
import { EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import axios from "../configs/axiosConfig";
import Papa from "papaparse";
import { useUserStore } from "../store/userStore";
import type { CsvRecord } from "../store/userStore";
import PreviewCsvData from "./PreviewCsvData";
import MissingVariablesModal from "./dashboard/MissingVariablesModal";
import "./PreviewCsv.scss";

const PreviewCsv = () => {
  const csvs = useUserStore((state) => state.csvs);
  const loading = useUserStore((state) => state.csvsLoading);
  const fetchCsvs = useUserStore((state) => state.fetchCsvs);

  const [error] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [selectedCsv, setSelectedCsv] = useState<CsvRecord | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [missingVariables, setMissingVariables] = useState<string[]>([]);
  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);

  const emailSubject = useUserStore((state) => state.emailSubject);
  const emailHtml = useUserStore((state) => state.emailHtml);

  useEffect(() => {
    fetchCsvs();
  }, [fetchCsvs]);

  // Sync selectedCsv with updated metadata from csvs list
  useEffect(() => {
    if (selectedCsv) {
      const updated = csvs.find((c) => c._id === selectedCsv._id);
      if (updated) {
        setSelectedCsv(updated);
      }
    }
  }, [csvs, selectedCsv]);

  const handleDeleteCsv = async (id: string) => {
    try {
      await axios.delete(`/upload/csv/${id}`);
      fetchCsvs();
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
              data.slice(1).filter((row) => row.some((cell) => cell)),
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
  };

  const handleSendEmail = async (params: {
    mode: "selected" | "range" | "bulk";
    rowIds?: string[];
    range?: { start: number; end: number };
  }) => {
    const isSingleSend =
      params.mode === "selected" && params.rowIds?.length === 1;

    if (!isSingleSend) {
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
          `Sending emails to rows ${params.range.start} to ${params.range.end}.`,
        );
      } else if (params.mode === "selected" && params.rowIds) {
        if (params.rowIds.length > 1) {
          message.info(
            `Sending emails to ${params.rowIds.length} selected rows.`,
          );
        }
      } else if (params.mode === "bulk") {
        message.info("Sending emails to all rows in the CSV.");
      }

      await axios.post("/send-email", payload);
      message.success("Email process started successfully!");
      fetchCsvs();
    } catch (err: unknown) {
      console.error("Error sending email:", err);
      const errorResponse = (
        err as {
          response?: {
            data?: {
              error?: string;
              missingVariables?: string[];
              message?: string;
            };
          };
        }
      ).response?.data;
      if (errorResponse?.error === "MISSING_VARIABLES") {
        setMissingVariables(errorResponse.missingVariables || []);
        setIsMissingModalOpen(true);
      } else {
        message.error(errorResponse?.message || "Failed to send email");
      }
    } finally {
      setSendingEmail(false);
    }
  };

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

  if (loading && csvs.length === 0) {
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
        loading={loading}
        locale={{ emptyText: "No CSV files uploaded yet" }}
        pagination={{ pageSize: 10 }}
        className="custom-table"
        style={{ background: "#fff", borderRadius: "12px", overflow: "hidden" }}
      />

      <PreviewCsvData
        isOpen={isModalOpen}
        onClose={handleModalClose}
        selectedCsv={selectedCsv}
        modalLoading={modalLoading}
        previewData={previewData}
        previewHeaders={previewHeaders}
        onSendEmail={handleSendEmail}
        sendingEmail={sendingEmail}
      />

      <MissingVariablesModal
        isOpen={isMissingModalOpen}
        onClose={() => setIsMissingModalOpen(false)}
        missingVariables={missingVariables}
      />
    </div>
  );
};

export default PreviewCsv;
