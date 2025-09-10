
import React, { useState, useEffect } from 'react';
// FIX: The Firebase v8 namespaced API is being used, which requires the v9 compatibility library.
// Updated imports to use 'firebase/compat' which provides the v8 API surface.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { AssetAccount, Asset, NotificationType } from '../../types';

interface AssetEditorProps {
    userId: string;
    // FIX: Update the type of the db parameter to the v8 Firestore type, now available via compat library.
    db: firebase.firestore.Firestore;
    assetAccounts: AssetAccount[];
    setNotification: (notification: NotificationType) => void;
    appId: string;
}

const AssetEditor: React.FC<AssetEditorProps> = ({ userId, db, assetAccounts, setNotification, appId }) => {
    const [accountName, setAccountName] = useState('');
    const [managingAccountId, setManagingAccountId] = useState('');
    
    const initialAssetForm: Omit<Asset, 'id' | 'currentValueTWD' | 'costTWD' | 'profitLossTWD'> & { id?: string } = { code: '', accountType: '股票', units: 0, cost: 0, currentValue: 0, currency: 'TWD' };
    const [assetFormData, setAssetFormData] = useState(initialAssetForm);
    const [editingAssetId, setEditingAssetId] = useState<string | null>(null);

    useEffect(() => {
        if (!managingAccountId && assetAccounts.length > 0) {
            setManagingAccountId(assetAccounts[0].id);
        }
    }, [assetAccounts, managingAccountId]);

    const handleAddAccount = async () => {
        if (!accountName.trim()) return;
        // FIX: Use Firebase v8 namespaced methods `collection` and `add`.
        await db.collection(`artifacts/${appId}/users/${userId}/assetAccounts`).add({ name: accountName, assets: [] });
        setAccountName('');
        setNotification({ message: '帳戶新增成功！', type: 'success', show: true });
    };

    const handleDeleteAccount = async (id: string) => {
        if (window.confirm('您確定嗎？這將會刪除該帳戶及其中的所有資產。')) {
            if (id === managingAccountId) setManagingAccountId('');
            // FIX: Use Firebase v8 namespaced methods `doc` and `delete`.
            await db.doc(`artifacts/${appId}/users/${userId}/assetAccounts/${id}`).delete();
            setNotification({ message: '帳戶已刪除。', type: 'success', show: true });
        }
    };

    const handleAssetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentAccount = assetAccounts.find(a => a.id === managingAccountId);
        if (!currentAccount) return;

        const assetDataToSave = {
            ...assetFormData,
            units: Number(assetFormData.units),
            cost: Number(assetFormData.cost),
            currentValue: Number(assetFormData.currentValue),
        };

        let updatedAssets;
        if (editingAssetId) {
            updatedAssets = (currentAccount.assets || []).map(asset => asset.id === editingAssetId ? { ...asset, ...assetDataToSave } : asset);
        } else {
            const newAsset = { ...assetDataToSave, id: Date.now().toString() };
            updatedAssets = [...(currentAccount.assets || []), newAsset];
        }

        // FIX: Use Firebase v8 namespaced methods `doc` and `update`.
        await db.doc(`artifacts/${appId}/users/${userId}/assetAccounts/${managingAccountId}`).update({ assets: updatedAssets });
        setAssetFormData(initialAssetForm);
        setEditingAssetId(null);
        setNotification({ message: `資產${editingAssetId ? '更新' : '新增'}成功！`, type: 'success', show: true });
    };

    const handleFetchPrices = async () => {
         setNotification({ message: '正在模擬抓取最新市價...', type: 'info', show: true });
         for (const account of assetAccounts) {
             if (!account.assets || account.assets.length === 0) continue;
             const updatedAssets = (account.assets).map(asset => {
                  if (asset.accountType === '股票' || asset.accountType === 'ETF') {
                     const changePercent = (Math.random() - 0.45) * 0.1; // -4.5% to +5.5% change
                     const newCurrentValue = parseFloat(String(asset.currentValue)) * (1 + changePercent);
                     return { ...asset, currentValue: newCurrentValue };
                  }
                  return asset;
             });
             // FIX: Use Firebase v8 namespaced methods `doc` and `update`.
             await db.doc(`artifacts/${appId}/users/${userId}/assetAccounts/${account.id}`).update({ assets: updatedAssets });
         }
        setNotification({ message: '所有投資標的市價已更新！', type: 'success', show: true });
    };
    
    const handleEditAsset = (asset: Asset) => {
        setAssetFormData(asset);
        setEditingAssetId(asset.id);
    };

    const handleDeleteAsset = async (assetId: string) => {
        const currentAccount = assetAccounts.find(a => a.id === managingAccountId);
        if (!currentAccount) return;
        const updatedAssets = currentAccount.assets.filter(a => a.id !== assetId);
        // FIX: Use Firebase v8 namespaced methods `doc` and `update`.
        await db.doc(`artifacts/${appId}/users/${userId}/assetAccounts/${managingAccountId}`).update({ assets: updatedAssets });
        setNotification({ message: '資產已刪除。', type: 'success', show: true });
    };

    const currentAssets = assetAccounts.find(a => a.id === managingAccountId)?.assets || [];

    return (
        <div className="space-y-8">
            <div className="p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium mb-2">管理資產帳戶</h3>
                <div className="flex space-x-2">
                    <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="新帳戶名稱 (例如: 富邦證券)" className="p-2 border rounded-md shadow-sm flex-grow" />
                    <button onClick={handleAddAccount} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 shadow-sm">新增帳戶</button>
                </div>
                <ul className="mt-4 space-y-2">
                    {assetAccounts.map(acc => (
                        <li key={acc.id} className="flex justify-between items-center p-2 bg-white rounded-md border">
                            <span>{acc.name}</span>
                            <button onClick={() => handleDeleteAccount(acc.id)} className="text-red-500 hover:text-red-700 text-sm">刪除</button>
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">管理帳戶內的資產</h3>
                    <button onClick={handleFetchPrices} className="bg-blue-500 text-white text-sm px-3 py-1 rounded-md hover:bg-blue-600">模擬獲取最新市價</button>
                 </div>
                <select value={managingAccountId} onChange={e => setManagingAccountId(e.target.value)} className="w-full p-2 border rounded-md mb-4" disabled={assetAccounts.length === 0}>
                    <option value="">選擇要管理的帳戶</option>
                    {assetAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
                {managingAccountId && (
                    <>
                        <form onSubmit={handleAssetSubmit} className="mb-8 p-4 border rounded-lg bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-4">
                           <input value={assetFormData.code} onChange={e => setAssetFormData({...assetFormData, code: e.target.value})} placeholder="代號/名稱" className="p-2 border rounded-md" />
                           <select value={assetFormData.accountType} onChange={e => setAssetFormData({...assetFormData, accountType: e.target.value as any})} className="p-2 border rounded-md"><option>股票</option><option>ETF</option><option>現金</option><option>不動產</option><option>美元資產</option></select>
                           <input type="number" step="any" value={assetFormData.units} onChange={e => setAssetFormData({...assetFormData, units: Number(e.target.value)})} placeholder="單位/股數" className="p-2 border rounded-md" />
                           <input type="number" step="any" value={assetFormData.cost} onChange={e => setAssetFormData({...assetFormData, cost: Number(e.target.value)})} placeholder="每單位平均成本" className="p-2 border rounded-md" />
                           <input type="number" step="any" value={assetFormData.currentValue} onChange={e => setAssetFormData({...assetFormData, currentValue: Number(e.target.value)})} placeholder="現價" className="p-2 border rounded-md" />
                           <select value={assetFormData.currency} onChange={e => setAssetFormData({...assetFormData, currency: e.target.value as any})} className="p-2 border rounded-md"><option>TWD</option><option>USD</option></select>
                           <div className="col-span-full flex justify-end space-x-2"><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">{editingAssetId ? '更新資產' : '新增資產'}</button>{editingAssetId && <button type="button" onClick={() => { setEditingAssetId(null); setAssetFormData(initialAssetForm); }} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">取消</button>}</div>
                        </form>
                        <div className="overflow-x-auto">
                           <table className="min-w-full">
                               <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">代號</th><th className="px-4 py-2 text-left">單位</th><th className="px-4 py-2 text-left">成本/單位</th><th className="px-4 py-2 text-left">操作</th></tr></thead>
                               <tbody>{currentAssets.map(asset => (<tr key={asset.id}>
                                   <td className="border px-4 py-2">{asset.code}</td>
                                   <td className="border px-4 py-2">{asset.units}</td>
                                   <td className="border px-4 py-2">{asset.cost}</td>
                                   <td className="border px-4 py-2"><button onClick={() => handleEditAsset(asset)} className="text-indigo-600 mr-2">編輯</button><button onClick={() => handleDeleteAsset(asset.id)} className="text-red-600">刪除</button></td>
                                   </tr>))}</tbody>
                           </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AssetEditor;
