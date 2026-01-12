import React from "react";
import { Card, Typography } from "antd";
import "./StatCard.scss";

const { Text, Title } = Typography;

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color,
}) => {
  return (
    <Card className="stat-card" bordered={false}>
      <div className="stat-card-content">
        <div className="stat-card-left">
          <Text className="stat-title">{title}</Text>
          <Title level={2} className="stat-value">
            {value}
          </Title>
          {trend && (
            <div className={`stat-trend ${trend.isUp ? "up" : "down"}`}>
              <span className="trend-icon">{trend.isUp ? "↑" : "↓"}</span>
              <span className="trend-value">{trend.value}%</span>
              <span className="trend-label">vs last month</span>
            </div>
          )}
        </div>
        <div className="stat-card-right" style={{ backgroundColor: color }}>
          <div className="stat-icon-wrapper">{icon}</div>
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
