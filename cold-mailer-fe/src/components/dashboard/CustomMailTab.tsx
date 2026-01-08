import {
  Card,
  Typography,
  Divider,
  Table,
  Tag,
  Space,
  Row,
  Col,
  Input,
  Button,
  Grid,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import ManualEmailInput from "../ManualEmailInput";
import { useUserStore, type CustomMail } from "../../store/userStore";
import "./CustomMailTab.scss";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

// NOTE: Column keys must match the keys defined in CustomMailSchema
const CUSTOM_MAIL_COLUMNS: ColumnsType<CustomMail> = [
  {
    title: "Email",
    dataIndex: "emailId",
    key: "emailId",
    ellipsis: true,
  },
  {
    title: "Company",
    dataIndex: "company",
    key: "company",
    render: (text) => text || "-",
  },
  {
    title: "Location",
    dataIndex: "location",
    key: "location",
    render: (text) => text || "-",
  },
  {
    title: "Status",
    dataIndex: "openedStatus",
    key: "openedStatus",
    width: 120,
    render: (opened: boolean) => (
      <Tag color={opened ? "success" : "processing"}>
        {opened ? "Opened" : "Sent"}
      </Tag>
    ),
  },
  {
    title: "Sent At",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 180,
    render: (date: string) => new Date(date).toLocaleString(),
  },
];

interface CustomMailTabProps {
  setIsPreviewOpen: (open: boolean) => void;
}

const CustomMailTab: React.FC<CustomMailTabProps> = ({ setIsPreviewOpen }) => {
  const user = useUserStore((state) => state.user);
  const emailSubject = useUserStore((state) => state.emailSubject);
  const emailHtml = useUserStore((state) => state.emailHtml);
  const setEmailSubject = useUserStore((state) => state.setEmailSubject);
  const setEmailHtml = useUserStore((state) => state.setEmailHtml);
  const screens = useBreakpoint();

  return (
    <div className="custom-mail-tab">
      <Row gutter={[24, 24]} className="dashboard-cards">
        <Col xs={24} lg={12}>
          <ManualEmailInput />
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <EditOutlined />
                <span>Email Content Editor</span>
              </Space>
            }
            bordered={false}
            className="dashboard-card"
            extra={
              <Button
                icon={<EyeOutlined />}
                onClick={() => setIsPreviewOpen(true)}
                disabled={!emailHtml}
              >
                {!screens.xs && "Preview"}
              </Button>
            }
          >
            <Space direction="vertical" className="editor-space" size="middle">
              <div>
                <Text strong>Email Subject</Text>
                <Input
                  placeholder="Enter email subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="subject-input"
                />
              </div>
              <div>
                <Text strong>HTML Layout / Message</Text>
                <TextArea
                  placeholder="Enter HTML content or plain text..."
                  rows={6}
                  value={emailHtml}
                  onChange={(e) => setEmailHtml(e.target.value)}
                  className="html-editor"
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Divider />

      <section className="manual-emails-section">
        <Title level={4} className="section-title">
          Manually Sent Emails
        </Title>
        <Table
          dataSource={user?.customMailSent || []}
          columns={CUSTOM_MAIL_COLUMNS}
          rowKey="_id"
          pagination={{ pageSize: 5 }}
          className="custom-table"
          locale={{ emptyText: "No manual emails sent yet" }}
        />
      </section>
    </div>
  );
};

export default CustomMailTab;
