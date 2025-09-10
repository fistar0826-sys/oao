
import React, { useState, useEffect } from 'react';
// FIX: The Firebase v8 namespaced API is being used, which requires the v9 compatibility library.
// Updated imports to use 'firebase/compat' which provides the v8 API surface.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { CashflowRecord, AssetAccount, Settings, NotificationType } from '../../types';
import { DEFAULT_CATEGORIES } from '../../constants';

interface CashflowEditorProps {
    userId: string;
    // FIX: Update the type of the db parameter to the v8 Firestore type, now available via compat library.
    db: firebase.firestore.Firestore;
    cashflowRecords: CashflowRecord[];
    assetAccounts: AssetAccount[];
    settings: Settings;
    setNotification: (notification: NotificationType) => void;
    appId: string;
    effectiveUsdToTwdRate: number;
}

const CashflowEditor: React.FC<CashflowEditorProps> = ({ userId, db, cashflowRecords, assetAccounts, settings, setNotification, appId, effectiveUsdToTwdRate }) => {
    const initialFormState = { id: '', date: new Date().toISOString().split('T')[0], type: 'expense' as 'expense' | 'income', category: '', amount: '', currency: 'TWD' as 'TWD' | 'USD', description: '', isRecurring: false, accountId: '', recurrenceDay: '' };
    const [formData, setFormData] = useState(initialFormState);
    const [editId, setEditId] = useState<string | null>(null);
    const [localRate, setLocalRate] = useState(String(effectiveUsdToTwdRate));

    useEffect(() => {
        setLocalRate(String(effectiveUsdToTwdRate));
    }, [effectiveUsdToTwdRate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: e.target.type === 'checkbox' ? checked : value }));
    };

    const handleRateUpdate = async () => {
        const newRate = parseFloat(localRate);
        if (!isNaN(newRate) && newRate > 0) {
            if (newRate !== settings.manualRate) {
                // FIX: Use Firebase v8 namespaced methods `doc` and `set`.
                await db.doc(`artifacts/${appId}/users/${userId}/settings/userSettings`).set({ manualRate: newRate }, { merge: true });
                setNotification({ message: `匯率已更新為 ${newRate}`, type: 'info', show: true });
            }
        } else if (localRate === '') {
             if (settings.manualRate !== null) {
                // FIX: Use Firebase v8 namespaced methods `doc` and `set`.
                await db.doc(`artifacts/${appId}/users/${userId}/settings/userSettings`).set({ manualRate: null }, { merge: true });
                setNotification({ message: '手動匯率已清除，將使用系統預設值。', type: 'info', show: true });
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.category || !formData.amount || !formData.accountId) {
             setNotification({ message: '類別、金額和帳戶為必填項。', type: 'error', show: true });
            return;
        }
        if (formData.isRecurring && (!formData.recurrenceDay || Number(formData.recurrenceDay) < 1 || Number(formData.recurrenceDay) > 31)) {
            setNotification({ message: '請為定額項目設定有效的每月執行日期 (1-31)。', type: 'error', show: true });
            return;
        }
        const collectionPath = `artifacts/${appId}/users/${userId}/cashflowRecords`;
        const accountName = assetAccounts.find(acc => acc.id === formData.accountId)?.name || '';
        const dataToSave = { ...formData, amount: parseFloat(formData.amount), accountName, recurrenceDay: formData.isRecurring ? Number(formData.recurrenceDay) : undefined };
        
        if (editId) {
            // FIX: Use Firebase v8 namespaced methods `doc` and `set`.
            await db.doc(`${collectionPath}/${editId}`).set(dataToSave);
            setNotification({ message: '收支紀錄更新成功！', type: 'success', show: true });
        } else {
            const { id, ...rest } = dataToSave; // Don't save empty id field
            // FIX: Use Firebase v8 namespaced methods `collection` and `add`.
            await db.collection(collectionPath).add(rest);
            setNotification({ message: '收支紀錄新增成功！', type: 'success', show: true });
        }
        setFormData(initialFormState);
        setEditId(null);
    };
    
    const handleEdit = (record: CashflowRecord) => {
        setFormData({ ...initialFormState, ...record, amount: record.amount.toString(), recurrenceDay: String(record.recurrenceDay || '') });
        setEditId(record.id);
    };

    const handleDelete = async (id: string) => {
        if(window.confirm('您確定要刪除這筆紀錄嗎？')) {
            // FIX: Use Firebase v8 namespaced methods `doc` and `delete`.
            await db.doc(`artifacts/${appId}/users/${userId}/cashflowRecords/${id}`).delete();
            setNotification({ message: '紀錄已刪除。', type: 'success', show: true });
        }
    };

    const categories = formData.type === 'income' ? 
        [...DEFAULT_CATEGORIES.income, ...(settings.customIncome || [])] : 
        [...DEFAULT_CATEGORIES.expense, ...(settings.customExpense || [])];

    return (
      <div>
        <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg bg-gray-50 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
            <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="p-2 border rounded-md shadow-sm" />
            <select name="accountId" value={formData.accountId} onChange={handleInputChange} className="p-2 border rounded-md shadow-sm"><option value="">選擇帳戶</option>{assetAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select>
            <select name="type" value={formData.type} onChange={handleInputChange} className="p-2 border rounded-md shadow-sm"><option value="expense">支出</option><option value="income">收入</option></select>
            <select name="category" value={formData.category} onChange={handleInputChange} className="p-2 border rounded-md shadow-sm"><option value="">選擇類別</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <input type="number" name="amount" placeholder="金額" value={formData.amount} onChange={handleInputChange} className="p-2 border rounded-md shadow-sm" />
            <div className="flex space-x-2">
                <select 
                    name="currency" 
                    value={formData.currency} 
                    onChange={handleInputChange} 
                    className={`p-2 border rounded-md shadow-sm transition-all duration-200 ${formData.currency === 'USD' ? 'w-1/2' : 'w-full'}`}
                >
                    <option value="TWD">TWD</option>
                    <option value="USD">USD</option>
                </select>
                {formData.currency === 'USD' && (
                    <input 
                        type="number" 
                        step="0.01"
                        aria-label="USD to TWD Exchange Rate"
                        placeholder="匯率"
                        value={localRate} 
                        onChange={e => setLocalRate(e.target.value)}
                        onBlur={handleRateUpdate}
                        className="p-2 border rounded-md shadow-sm w-1/2"
                    />
                )}
            </div>
            <input type="text" name="description" placeholder="說明 (選填)" value={formData.description} onChange={handleInputChange} className="p-2 border rounded-md shadow-sm" />
            <div className="p-2 border rounded-md bg-white shadow-sm">
                <div className="flex items-center">
                    <input type="checkbox" id="isRecurring" name="isRecurring" checked={formData.isRecurring} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                    <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-900">定額項目</label>
                </div>
                {formData.isRecurring && (
                    <div className="flex items-center mt-2">
                        <label htmlFor="recurrenceDay" className="mr-2 text-sm text-gray-700">每月</label>
                        <input type="number" id="recurrenceDay" name="recurrenceDay" value={formData.recurrenceDay} onChange={handleInputChange} min="1" max="31" placeholder="日" className="p-1 border rounded-md shadow-sm w-20" />
                        <span className="ml-2 text-sm text-gray-700">日</span>
                    </div>
                )}
            </div>
            <div className="lg:col-span-2 flex justify-end space-x-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 shadow-sm transition-colors w-full">{editId ? '更新' : '新增'}</button>
                {editId && <button type="button" onClick={() => { setEditId(null); setFormData(initialFormState); }} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 shadow-sm transition-colors w-full">取消</button>}
            </div>
        </form>

        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">帳戶</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">類型</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金額</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th></tr></thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {cashflowRecords.map(record => (
                        <tr key={record.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{record.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{record.accountName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {record.type === 'income' ? '收入' : '支出'}
                                </span>
                                {record.isRecurring && (
                                    <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                        定額
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{record.amount.toLocaleString()} <span className="text-xs text-gray-400">{record.currency}</span></td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => handleEdit(record)} className="text-indigo-600 hover:text-indigo-900 mr-4">編輯</button>
                                <button onClick={() => handleDelete(record.id)} className="text-red-600 hover:text-red-900">刪除</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    );
};

export default CashflowEditor;
