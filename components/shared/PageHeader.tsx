import React from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
    return (
        <div className="mb-6 border-b border-gray-200 pb-4">
            <h2 className="text-3xl font-extrabold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-2 bg-blue-50 p-3 rounded-lg border border-blue-200">{subtitle}</p>}
        </div>
    );
}

export default PageHeader;
