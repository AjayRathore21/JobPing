import type { ThemeConfig } from "antd";

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: "#000000",
    borderRadius: 12,
    fontFamily:
      "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    colorBgContainer: "rgba(255, 255, 255, 0.8)",
    colorTextBase: "#1A1A1A",
    colorTextSecondary: "#666666",
  },
  components: {
    Button: {
      borderRadius: 12,
      controlHeight: 40,
      fontWeight: 600,
      paddingInline: 24,
    },
    Card: {
      borderRadiusLG: 12,
      boxShadowTertiary: "0 8px 30px rgba(0, 0, 0, 0.04)",
    },
    Input: {
      borderRadius: 12,
      controlHeight: 44,
      colorBgContainer: "#FFFFFF",
    },
    Table: {
      borderRadius: 12,
      headerBg: "transparent",
      headerColor: "#666666",
      rowHoverBg: "rgba(0, 0, 0, 0.02)",
    },
    Modal: {
      borderRadiusLG: 12,
      contentBg: "#F4F5F0",
    },
    Menu: {
      itemBorderRadius: 12,
      itemSelectedBg: "#000000",
      itemSelectedColor: "#FFFFFF",
    },
  },
};
