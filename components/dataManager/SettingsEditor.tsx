
import React, { useState, useEffect } from 'react';
// FIX: The Firebase v8 namespaced API is being used, which requires the v9 compatibility library.
// Updated imports to use 'firebase/compat' which provides the v8 API surface.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Settings, NotificationType } from '../../types';

interface SettingsEditorProps {
    userId: string;
    // FIX: Update the type of the db parameter to the v8 Firestore type, now available via compat library.
    db: firebase.firestore.Firestore;
    settings: Settings;
    setNotification: (notification: NotificationType) => void;
    appId: string;
}

const SettingsEditor: React.FC<SettingsEditorProps> = ({ userId, db, settings, setNotification, appId }) => {
    const [newIncomeCat, setNewIncomeCat] = useState('');
    const [newExpenseCat, setNewExpenseCat] = useState('');
    const [manualRate, setManualRate] = useState<string | number>(settings.manualRate || '');

    useEffect(() => {
        setManualRate(settings.manualRate || '');
    }, [settings.manualRate]);


    const handleSaveSettings = async () => {
        const settingsData = { ...settings, manualRate: parseFloat(String(manualRate)) || null };
        // FIX: Use Firebase v8 namespaced methods `doc` and `set`.
        await db.doc(`artifacts/${appId}/users/${userId}/settings/userSettings`).set(settingsData, { merge: true });
        setNotification({ message: '設定已儲存！', type: 'success', show: true });
    };

    const handleAddCategory = async (type: 'income' | 'expense') => {
        const category = type === 'income' ? newIncomeCat.trim() : newExpenseCat.trim();
        if (!category) return;
        
        const fieldKey = type === 'income' ? 'customIncome' : 'customExpense';
        const currentCategories = settings[fieldKey] || [];
        if (currentCategories.includes(category)) {
            setNotification({ message: '類別已存在。', type: 'error', show: true });
            return;
        }

        // FIX: Use Firebase v8 namespaced methods `doc` and `set`.
        await db.doc(`artifacts/${appId}/users/${userId}/settings/userSettings`).set({ [fieldKey]: [...currentCategories, category] }, { merge: true });
        
        if (type === 'income') setNewIncomeCat('');
        else setNewExpenseCat('');
        setNotification({ message: '類別新增成功！', type: 'success', show: true });
    };
    
    const handleRemoveCategory = async (type: 'income' | 'expense', categoryToRemove: string) => {
        if (window.confirm(`您確定要移除「${categoryToRemove}」這個類別嗎？`)) {
            const fieldKey = type === 'income' ? 'customIncome' : 'customExpense';
            const currentCategories = settings[fieldKey] || [];
            const updatedCategories = currentCategories.filter(cat => cat !== categoryToRemove);

            // FIX: Use Firebase v8 namespaced methods `doc` and `set`.
            await db.doc(`artifacts/${appId}/users/${userId}/settings/userSettings`).set({ [fieldKey]: updatedCategories }, { merge: true });

            setNotification({ message: '類別已移除。', type: 'success', show: true });
        }
    };
    
    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <div className="p-6 border rounded-xl bg-white shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">匯率設定</h3>
                <div className="flex items-center space-x-4">
                    <label className="font-medium text-gray-700">USD-TWD 手動匯率:</label>
                    <input type="number" step="any" value={manualRate} onChange={e => setManualRate(e.target.value)} className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="例如: 32.5" />
                </div>
                <p className="text-sm text-gray-500 mt-2">* 留白則使用系統預設匯率。</p>
            </div>
             
            <div className="p-6 border rounded-xl bg-white shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">自訂收入類別</h3>
                <div className="flex items-center space-x-2 mb-4">
                    <input 
                        value={newIncomeCat} 
                        onChange={e => setNewIncomeCat(e.target.value)} 
                        onKeyPress={(e) => { if (e.key === 'Enter') handleAddCategory('income'); }}
                        placeholder="輸入新類別名稱後按 Enter 或新增" 
                        className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition" 
                    />
                    <button 
                        onClick={() => handleAddCategory('income')} 
                        className="bg-indigo-600 text-white px-5 py-2 rounded-md hover:bg-indigo-700 transition-colors shadow-sm font-semibold flex-shrink-0"
                    >新增</button>
                </div>
                <div className="border-t border-gray-200 pt-3">
                    {(settings.customIncome || []).length > 0 ? (
                        <ul className="space-y-2">
                            {(settings.customIncome || []).map(cat => (
                                <li key={cat} className="flex justify-between items-center bg-gray-50 p-3 rounded-md group hover:bg-gray-100 transition-colors">
                                    <span className="font-medium text-gray-700">{cat}</span>
                                    <button onClick={() => handleRemoveCategory('income', cat)} className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all" title={`移除 ${cat}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-3 text-sm">尚未新增任何自訂收入類別。</p>
                    )}
                </div>
            </div>

            <div className="p-6 border rounded-xl bg-white shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">自訂支出類別</h3>
                <div className="flex items-center space-x-2 mb-4">
                     <input 
                        value={newExpenseCat} 
                        onChange={e => setNewExpenseCat(e.target.value)} 
                        onKeyPress={(e) => { if (e.key === 'Enter') handleAddCategory('expense'); }}
                        placeholder="輸入新類別名稱後按 Enter 或新增" 
                        className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition" 
                     />
                     <button 
                        onClick={() => handleAddCategory('expense')} 
                        className="bg-indigo-600 text-white px-5 py-2 rounded-md hover:bg-indigo-700 transition-colors shadow-sm font-semibold flex-shrink-0"
                    >新增</button>
                 </div>
                  <div className="border-t border-gray-200 pt-3">
                    {(settings.customExpense || []).length > 0 ? (
                        <ul className="space-y-2">
                            {(settings.customExpense || []).map(cat => (
                                <li key={cat} className="flex justify-between items-center bg-gray-50 p-3 rounded-md group hover:bg-gray-100 transition-colors">
                                    <span className="font-medium text-gray-700">{cat}</span>
                                    <button onClick={() => handleRemoveCategory('expense', cat)} className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all" title={`移除 ${cat}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <p className="text-center text-gray-500 py-3 text-sm">尚未新增任何自訂支出類別。</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t mt-8">
                <button 
                    onClick={handleSaveSettings} 
                    className="bg-blue-600 text-white px-8 py-2.5 rounded-lg hover:bg-blue-700 shadow-md font-semibold transition-all transform hover:scale-105"
                >儲存所有設定</button>
            </div>
        </div>
    );
};

export default SettingsEditor;
