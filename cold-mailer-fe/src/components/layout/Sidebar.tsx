import React, { useState } from "react";
import {
  FileOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import { Layout, Menu, type MenuProps } from "antd";
import { useNavigate, useLocation } from "react-router";
import "./Sidebar.scss";

const { Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem("Dashboard", "/dashboard", <PieChartOutlined />),
  getItem("Analytics", "/analytics", <PieChartOutlined />),
  // getItem("Campaigns", "/campaigns", <DesktopOutlined />),
  // getItem("Email Accounts", "/accounts", <UserOutlined />),
  // getItem("Team", "sub2", <TeamOutlined />, [
  //   getItem("Members", "/team/members"),
  //   getItem("Roles", "/team/roles"),
  // ]),
  getItem("Settings", "/settings", <FileOutlined />),
];

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    navigate(e.key);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      className="sidebar"
      width={240}
      theme="dark"
    >
      <div className="logo-container">
        <img
          className="logo-icon"
          src="/src/assets/images/jobping.png"
          alt="JobPing"
        />

        {!collapsed && <span className="logo-text">JobPing</span>}
      </div>
      <Menu
        theme="dark"
        selectedKeys={[location.pathname]}
        mode="inline"
        items={items}
        onClick={handleMenuClick}
      />
    </Sider>
  );
};

export default Sidebar;
