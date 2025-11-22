import React from 'react';
import './AnalyticsCard.css';

const AnalyticsCard = ({ title, value, icon, subtitle }) => {
    return (
        <div className="analytics-card">
            <div className="analytics-card-header">
                <h3 className="analytics-card-title">{title}</h3>
                {icon && <span className="analytics-card-icon">{icon}</span>}
            </div>
            <div className="analytics-card-value">{value}</div>
            {subtitle && <div className="analytics-card-subtitle">{subtitle}</div>}
        </div>
    );
};

export default AnalyticsCard;
