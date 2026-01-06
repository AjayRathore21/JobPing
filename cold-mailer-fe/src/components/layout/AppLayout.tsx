import React from "react";
import {
  Layout,
  theme,
  Avatar,
  Dropdown,
  Breadcrumb,
  type MenuProps,
} from "antd";
import { Outlet, useNavigate, useLocation, Link } from "react-router";
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useUserStore } from "../../store/userStore";
import { setTokenToLS } from "../../HelperMethods";
import Sidebar from "./Sidebar";
import "./AppLayout.scss";

const { Header, Content, Footer } = Layout;

const AppLayout: React.FC = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const user = useUserStore((state) => state.user);
  const clearUser = useUserStore((state) => state.clearUser);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearUser();
    setTokenToLS("");
    navigate("/login");
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      label: "My Profile",
      icon: <UserOutlined />,
    },
    {
      key: "settings",
      label: "Account Settings",
      icon: <SettingOutlined />,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Sign Out",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  const pathSnippets = location.pathname.split("/").filter((i) => i);
  const breadcrumbItems = [
    {
      title: <Link to="/dashboard">Home</Link>,
    },
    ...pathSnippets.map((snippet, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join("/")}`;
      const title = snippet.charAt(0).toUpperCase() + snippet.slice(1);
      return {
        title: <Link to={url}>{title}</Link>,
      };
    }),
  ];

  return (
    <Layout className="app-layout">
      <Sidebar />
      <Layout className="layout-main">
        <Header className="header" style={{ background: colorBgContainer }}>
          <div className="header-left">
            <Breadcrumb items={breadcrumbItems} />
          </div>
          <div className="header-right">
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <div className="user-profile" style={{ cursor: "pointer" }}>
                <span>{user?.name || user?.email || "User"}</span>
                <Avatar src={user?.picture} icon={<UserOutlined />} />
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="content">
          <Outlet />
        </Content>
        <Footer className="footer">
          JobPing ©{new Date().getFullYear()} • Elevate Your Outreach
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
