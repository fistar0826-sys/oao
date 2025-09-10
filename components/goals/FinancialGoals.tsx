import React from 'react';
import { Goal, AssetAccount } from '../../types';
import Card from '../shared/Card';
import PageHeader from '../shared/PageHeader';

interface FinancialGoalsProps {
  goals: Goal[];
  assetAccounts: AssetAccount[];
}

const FinancialGoals: React.FC<FinancialGoalsProps> = ({ goals, assetAccounts }) => {
    const getAccountName = (accountId: string) => assetAccounts.find(a => a.id === accountId)?.name || '未連結';
    return (
        <Card>
            <PageHeader title="財務目標進度" subtitle="此頁面為您的目標進度。如需新增或修改目標，請前往「資料管理」頁面。" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.length > 0 ? goals.map(goal => {
                    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                    return (
                        <div key={goal.id} className="p-4 border rounded-lg shadow-sm bg-white transition-transform transform hover:-translate-y-1 hover:shadow-lg">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{goal.name}</h3>
                                    <p className="text-xs text-gray-500">連結帳戶: {getAccountName(goal.accountId)}</p>
                                </div>
                                <span className="text-sm text-gray-500">{goal.targetDate}</span>
                            </div>
                            <p className="text-gray-700 text-sm mt-4">
                                進度: ${goal.currentAmount.toLocaleString()} / <span className="font-medium">${goal.targetAmount.toLocaleString()}</span>
                            </p>
                            
                            <div className="mt-2">
                                <div className="flex justify-between mb-1">
                                    <span className="text-xs font-medium text-blue-700">進度</span>
                                    <span className="text-sm font-medium text-blue-700">{progress.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4">
                                    <div 
                                        className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${progress}%` }}
                                        aria-valuenow={progress}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        role="progressbar"
                                        aria-label={`${goal.name} progress`}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    );
                }) : <p className="text-gray-500 col-span-full text-center py-8">尚無財務目標。</p>}
            </div>
        </Card>
    );
};

export default FinancialGoals;