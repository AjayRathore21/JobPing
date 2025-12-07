import { useNavigate } from "react-router";
import { useUserStore } from "../store/userStore";
import { useRef } from "react";
import { Button, Space } from "antd";
import PreviewCsv from "./PreviewCsv";
import { setTokenToLS } from "../HelperMethods";
import axios from "axios";

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
    console.log("Upload button clicked"); 

    console.log("File input ref:", fileInputRef.current);
    axios
      .post("/upload/csv", {
        file: fileInputRef.current?.files?.[0],
      })
      .then((res) => {
        console.log("Upload response:", res.data);
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
