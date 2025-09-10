
import React, { useState, useEffect } from 'react';
// FIX: The Firebase v8 namespaced API is being used, which requires the v9 compatibility library.
// Updated imports to use 'firebase/compat' which provides the v8 API surface.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Budget, Settings, NotificationType } from '../../types';
import { DEFAULT_CATEGORIES } from '../../constants';

interface BudgetEditorProps {
    userId: string;
    // FIX: Update the type of the db parameter to the v8 Firestore type, now available via compat library.
    db: firebase.firestore.Firestore;
    budgets: Budget[];
    settings: Settings;
    setNotification: (notification: NotificationType) => void;
    appId: string;
}

const BudgetEditor: React.FC<BudgetEditorProps> = ({ userId, db, budgets, settings, setNotification, appId }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [budgetData, setBudgetData] = useState<{ [key: string]: string }>({});
    
    const expenseCategories = [...DEFAULT_CATEGORIES.expense, ...(settings.customExpense || [])];

    useEffect(() => {
        const monthBudgets = budgets.filter(b => b.month === selectedMonth);
        const data = monthBudgets.reduce((acc, curr) => ({ ...acc, [curr.category]: String(curr.amount) }), {});
        setBudgetData(data);
    }, [selectedMonth, budgets, expenseCategories]);

    const handleBudgetChange = (category: string, amount: string) => {
        setBudgetData(prev => ({ ...prev, [category]: amount }));
    };

    const handleSaveBudgets = async () => {
        for (const category of expenseCategories) {
            const amount = parseFloat(budgetData[category]) || 0;
            const existingBudget = budgets.find(b => b.month === selectedMonth && b.category === category);
            const docPath = `artifacts/${appId}/users/${userId}/budgets`;
            if (existingBudget) {
                if (amount > 0) {
                    // FIX: Use Firebase v8 namespaced methods `doc` and `update`.
                    await db.doc(`${docPath}/${existingBudget.id}`).update({ amount });
                } else {
                    // FIX: Use Firebase v8 namespaced methods `doc` and `delete`.
                    await db.doc(`${docPath}/${existingBudget.id}`).delete();
                }
            } else if (amount > 0) {
                // FIX: Use Firebase v8 namespaced methods `collection` and `add`.
                await db.collection(docPath).add({ month: selectedMonth, category, amount });
            }
        }
        setNotification({ message: '預算儲存成功！', type: 'success', show: true });
    };

    return (
        <div>
            <div className="mb-4 flex items-center space-x-4">
                <label htmlFor="budget-month">選擇月份:</label>
                <input type="month" id="budget-month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="p-2 border rounded-md shadow-sm" />
            </div>
            <div className="space-y-4 max-w-md">
                {expenseCategories.map(category => (
                    <div key={category} className="grid grid-cols-2 items-center gap-4">
                        <label className="text-right font-medium">{category}:</label>
                        <input type="number" value={budgetData[category] || ''} onChange={e => handleBudgetChange(category, e.target.value)} placeholder="預算金額" className="p-2 border rounded-md shadow-sm" />
                    </div>
                ))}
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={handleSaveBudgets} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 shadow-sm">儲存預算</button>
            </div>
        </div>
    );
};

export default BudgetEditor;
