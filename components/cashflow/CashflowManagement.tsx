import React, { useState, useMemo } from 'react';
import { CashflowRecord } from '../../types';
import Card from '../shared/Card';
import PageHeader from '../shared/PageHeader';

const CashflowManagement: React.FC<{ cashflowRecords: CashflowRecord[] }> = ({ cashflowRecords }) => {
    type SortKey = keyof CashflowRecord;
    type SortDirection = 'ascending' | 'descending';

    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'date', direction: 'descending' });
    
    const sortedRecords = useMemo(() => {
        if (cashflowRecords.length === 0) return [];
        let sortableItems = [...cashflowRecords];
        sortableItems.sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            if (aVal < bVal) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aVal > bVal) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        return sortableItems;
    }, [cashflowRecords, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const headers: { key: SortKey; label: string }[] = [
        { key: 'date', label: '日期' },
        { key: 'type', label: '類型' },
        { key: 'category', label: '類別' },
        { key: 'amount', label: '金額' },
        { key: 'currency', label: '幣別' },
        { key: 'accountName', label: '帳戶' },
        { key: 'description', label: '說明' },
    ];

    return (
        <Card>
            <PageHeader title="收支管理 & 帳本" subtitle="此頁面為您的收支記錄。如需新增、編輯或刪除記錄，請前往「資料管理」頁面。" />
            <div className="mt-8">
                {cashflowRecords.length > 0 ? (
                    <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    {headers.map(({ key, label }) => (
                                        <th key={key} scope="col" className="py-3 px-6 cursor-pointer" onClick={() => requestSort(key)}>
                                            {label}
                                            {sortConfig.key === key ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : ''}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRecords.map(record => (
                                    <tr key={record.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="py-4 px-6">{record.date}</td>
                                        <td className={`py-4 px-6 font-medium ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{record.type === 'income' ? '收入' : '支出'}</td>
                                        <td className="py-4 px-6">{record.category}</td>
                                        <td className="py-4 px-6">{record.amount.toLocaleString()}</td>
                                        <td className="py-4 px-6">{record.currency || 'TWD'}</td>
                                        <td className="py-4 px-6 text-gray-600">{record.accountName || 'N/A'}</td>
                                        <td className="py-4 px-6 max-w-xs truncate">{record.description || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">目前沒有收支記錄。</p>
                )}
            </div>
        </Card>
    );
};

export default CashflowManagement;
