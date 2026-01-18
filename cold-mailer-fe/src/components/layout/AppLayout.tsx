import React from "react";
import {
  Layout,
  Avatar,
  Dropdown,
  Drawer,
  Button,
  Grid,
  type MenuProps,
} from "antd";
import { Outlet, useNavigate, useLocation, Link } from "react-router";
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { useUserStore } from "../../store/userStore";
import { setTokenToLS } from "../../HelperMethods";
import "./AppLayout.scss";

const { Header, Content } = Layout;
const { useBreakpoint } = Grid;

const AppLayout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

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
    // {
    //   key: "profile",
    //   label: "My Profile",
    //   icon: <UserOutlined />,
    // },
    // {
    //   key: "settings",
    //   label: "Account Settings",
    //   icon: <SettingOutlined />,
    // },
    // {
    //   type: "divider",
    // },
    {
      key: "logout",
      label: "Sign Out",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Analytics", path: "/analytics" },
  ];

  return (
    <Layout className="app-layout">
      <Header className="global-header">
        <div className="header-container">
          <div className="header-left">
            <Link to="/dashboard" className="logo-link">
              <span className="logo-text">JobPing</span>
            </Link>
          </div>

          {!isMobile && (
            <div className="header-center">
              <nav className="pill-nav">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-item ${
                      location.pathname === item.path ? "active" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}

          <div className="header-right">
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setDrawerOpen(true)}
                className="mobile-toggle"
              />
            )}
            <div className="utility-icons">
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                arrow
              >
                <div className="user-avatar-wrapper">
                  <Avatar src={user?.picture} icon={<UserOutlined />} />
                </div>
              </Dropdown>
            </div>
          </div>
        </div>
      </Header>

      <Content className="main-content-wrapper">
        <div className="content-container">
          <Outlet />
        </div>
      </Content>

      <Drawer
        title="Menu"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        className="mobile-nav-drawer"
      >
        <div className="mobile-nav-links">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-item ${
                location.pathname === item.path ? "active" : ""
              }`}
              onClick={() => setDrawerOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </Drawer>
    </Layout>
  );
};

export default AppLayout;
