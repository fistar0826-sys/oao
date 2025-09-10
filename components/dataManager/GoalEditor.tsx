
import React, { useState, useMemo } from 'react';
// FIX: The Firebase v8 namespaced API is being used, which requires the v9 compatibility library.
// Updated imports to use 'firebase/compat' which provides the v8 API surface.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Goal, AssetAccount, NotificationType } from '../../types';

interface GoalEditorProps {
    userId: string;
    // FIX: Update the type of the db parameter to the v8 Firestore type, now available via compat library.
    db: firebase.firestore.Firestore;
    goals: Goal[];
    assetAccounts: AssetAccount[];
    setNotification: (notification: NotificationType) => void;
    appId: string;
    effectiveUsdToTwdRate: number;
}

const GoalEditor: React.FC<GoalEditorProps> = ({ userId, db, goals, assetAccounts, setNotification, appId, effectiveUsdToTwdRate }) => {
    const initialFormState = { name: '', targetAmount: '', currentAmount: '', targetDate: '', accountId: '' };
    const [formData, setFormData] = useState(initialFormState);
    const [editId, setEditId] = useState<string | null>(null);

    const processedAccounts = useMemo(() => {
        return assetAccounts.map(account => {
            const totalValueTWD = (account.assets || []).reduce((sum, asset) => {
                const rate = asset.currency === 'USD' ? effectiveUsdToTwdRate : 1;
                const value = parseFloat(String(asset.currentValue)) || 0;
                const units = parseFloat(String(asset.units)) || 0;
                return sum + (value * units * rate);
            }, 0);
            return { id: account.id, name: account.name, totalValueTWD };
        }).sort((a, b) => b.totalValueTWD - a.totalValueTWD);
    }, [assetAccounts, effectiveUsdToTwdRate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'accountId') {
            const selectedAccount = processedAccounts.find(acc => acc.id === value);
            const amountToSet = selectedAccount ? selectedAccount.totalValueTWD.toFixed(0) : '';
            setFormData(prev => ({ ...prev, accountId: value, currentAmount: amountToSet }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            ...formData,
            targetAmount: parseFloat(formData.targetAmount),
            currentAmount: parseFloat(formData.currentAmount)
        };
        const collectionPath = `artifacts/${appId}/users/${userId}/goals`;
        if (editId) {
            // FIX: Use Firebase v8 namespaced methods `doc` and `set`.
            await db.doc(`${collectionPath}/${editId}`).set(data);
            setNotification({ message: '目標更新成功！', type: 'success', show: true });
        } else {
            const { ...rest } = data;
            // FIX: Use Firebase v8 namespaced methods `collection` and `add`.
            await db.collection(collectionPath).add(rest);
            setNotification({ message: '目標新增成功！', type: 'success', show: true });
        }
        setFormData(initialFormState);
        setEditId(null);
    };
    
    const handleEdit = (goal: Goal) => {
        setFormData({ ...goal, targetAmount: String(goal.targetAmount), currentAmount: String(goal.currentAmount) });
        setEditId(goal.id);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('您確定要刪除這個目標嗎？')) {
            // FIX: Use Firebase v8 namespaced methods `doc` and `delete`.
            await db.doc(`artifacts/${appId}/users/${userId}/goals/${id}`).delete();
            setNotification({ message: '目標已刪除。', type: 'success', show: true });
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg bg-gray-50 space-y-4">
                <h3 className="text-lg font-medium">{editId ? '編輯財務目標' : '新增財務目標'}</h3>
                <input name="name" value={formData.name} onChange={handleInputChange} placeholder="目標名稱 (例如: 購車基金)" className="w-full p-2 border rounded-md" required />
                <input type="number" name="targetAmount" value={formData.targetAmount} onChange={handleInputChange} placeholder="目標金額" className="w-full p-2 border rounded-md" required />
                <select name="accountId" value={formData.accountId} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white">
                    <option value="">連結到資產帳戶 (選填)</option>
                    {processedAccounts.map(acc => {
                        const targetAmountNum = parseFloat(formData.targetAmount) || 0;
                        const isSuggested = targetAmountNum > 0 && acc.totalValueTWD >= targetAmountNum;
                        const suggestionText = `($${acc.totalValueTWD.toLocaleString(undefined, {maximumFractionDigits: 0})})`;
                        return (
                            <option key={acc.id} value={acc.id} className={isSuggested ? 'font-bold text-green-700 bg-green-50' : ''}>
                                {acc.name} {isSuggested && ' (建議)'} {suggestionText}
                            </option>
                        );
                    })}
                </select>
                <input type="number" name="currentAmount" value={formData.currentAmount} onChange={handleInputChange} placeholder="目前已存金額" className="w-full p-2 border rounded-md" required />
                <input type="date" name="targetDate" value={formData.targetDate} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
                <div className="flex justify-end space-x-2">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">{editId ? '更新目標' : '新增目標'}</button>
                    {editId && <button type="button" onClick={() => { setEditId(null); setFormData(initialFormState); }} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">取消</button>}
                </div>
            </form>
            <div className="space-y-4">
                {goals.map(goal => (
                    <div key={goal.id} className="p-4 border rounded-lg bg-white">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold">{goal.name}</span><div><button onClick={() => handleEdit(goal)} className="text-indigo-600 hover:text-indigo-900 mr-4 text-sm">編輯</button><button onClick={() => handleDelete(goal.id)} className="text-red-600 hover:text-red-900 text-sm">刪除</button></div>
                        </div>
                        <p>進度: ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}</p>
                         <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${(goal.currentAmount / goal.targetAmount) * 100}%` }}></div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 text-right">目標日期: {goal.targetDate}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GoalEditor;
