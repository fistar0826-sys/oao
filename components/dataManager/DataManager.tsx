
import React, { useState } from 'react';
// FIX: The Firebase v8 namespaced API is being used, which requires the v9 compatibility library.
// Updated imports to use 'firebase/compat' which provides the v8 API surface.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { AssetAccount, CashflowRecord, Budget, Goal, Settings, NotificationType } from '../../types';
import PageHeader from '../shared/PageHeader';
import CashflowEditor from './CashflowEditor';
import AssetEditor from './AssetEditor';
import BudgetEditor from './BudgetEditor';
import GoalEditor from './GoalEditor';
import SettingsEditor from './SettingsEditor';

interface DataManagerProps {
  userId: string;
  // FIX: Update the type of the db prop to the v8 Firestore type, now available via compat library.
  db: firebase.firestore.Firestore;
  assetAccounts: AssetAccount[];
  cashflowRecords: CashflowRecord[];
  budgets: Budget[];
  goals: Goal[];
  settings: Settings;
  setNotification: (notification: NotificationType) => void;
  appId: string;
  effectiveUsdToTwdRate: number;
}

type ActiveTab = 'cashflow' | 'assets' | 'budgets' | 'goals' | 'settings';

const DataManager: React.FC<DataManagerProps> = (props) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('cashflow');

    const renderContent = () => {
        switch (activeTab) {
            case 'assets':
                return <AssetEditor {...props} />;
            case 'cashflow':
                return <CashflowEditor {...props} />;
            case 'budgets':
                return <BudgetEditor {...props} />;
            case 'goals':
                return <GoalEditor {...props} />;
            case 'settings':
                return <SettingsEditor {...props} />;
            default:
                return null;
        }
    };

    const tabs: { id: ActiveTab; label: string }[] = [
        { id: 'cashflow', label: '收支管理' },
        { id: 'assets', label: '資產管理' },
        { id: 'budgets', label: '預算管理' },
        { id: 'goals', label: '目標管理' },
        { id: 'settings', label: '系統設定' },
    ];

    return (
        <div>
            <PageHeader title="資料管理中心" />
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {tabs.map(tab => (
                       <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            className={`${activeTab === tab.id 
                                ? 'border-indigo-500 text-indigo-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors duration-200`}
                        >
                           {tab.label}
                       </button>
                    ))}
                </nav>
            </div>
            <div className="mt-6">
                {renderContent()}
            </div>
        </div>
    );
};

export default DataManager;
