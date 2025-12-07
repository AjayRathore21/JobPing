import { useNavigate } from "react-router";
import { useUserStore } from "../store/userStore";
import { useRef } from "react";
import { Button, Space } from "antd";
import PreviewCsv from "./PreviewCsv";
import { setTokenToLS } from "../HelperMethods";
import axios from "../configs/axiosConfig";

const DashboardPage = () => {
  const user = useUserStore((state) => state.user);
  const clearUser = useUserStore((state) => state.clearUser);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearUser();
    setTokenToLS("");
    // Optionally redirect to login page
    navigate("/login");
  };

  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      console.error("No file selected");
      return;
    }

    const formData = new FormData();
    formData.append("csv", file); // "csv" matches multer's upload.single("csv")

    axios
      .post("/upload/csv", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => {
        console.log("Upload response:", res.data);
        // Clear the file input after successful upload
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      })
      .catch((err) => {
        console.error("Upload error:", err);
      });
  };

  return (
    <div>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 0",
        }}
      >
        <div>{user && <span>Welcome, {user.name || user.email}!</span>}</div>
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            background: "#1677ff",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </header>
      <main>
        <h1>Dashboard</h1>
        <Space>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            style={{ display: "block", margin: "16px 0" }}
          />
          <Button onClick={handleUpload} type="primary">
            Upload
          </Button>
        </Space>
      </main>

      <PreviewCsv />
    </div>
  );
};

export default DashboardPage;
