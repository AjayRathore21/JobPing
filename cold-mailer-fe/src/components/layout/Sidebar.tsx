import React, { useState } from "react";
import { PieChartOutlined } from "@ant-design/icons";
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
];

interface SidebarContentProps {
  collapsed?: boolean;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
  collapsed,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    navigate(e.key);
  };

  return (
    <>
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
    </>
  );
};

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      className="sidebar desktop-sidebar"
      width={240}
      theme="dark"
      breakpoint="lg"
      collapsedWidth="80"
    >
      <SidebarContent collapsed={collapsed} />
    </Sider>
  );
};

export default Sidebar;
