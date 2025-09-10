
import React, { useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';
import { AssetAccount, CashflowRecord } from '../../types';
import { calculateAssetSummary } from '../../utils/dataProcessing';
import { BUFFETT_TARGET } from '../../constants';
import Card from '../shared/Card';
import PageHeader from '../shared/PageHeader';

interface DashboardProps {
  userId: string;
  assetAccounts: AssetAccount[];
  cashflowRecords: CashflowRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ userId, assetAccounts, cashflowRecords }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const { total, breakdown, totalUsdAssetsInTwd } = calculateAssetSummary(assetAccounts);
  
  const lastMonthSummary = useMemo(() => {
    const now = new Date();
    const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const lastMonthYear = firstDayOfLastMonth.getFullYear();
    const lastMonthMonth = firstDayOfLastMonth.getMonth();
    
    const records = cashflowRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= firstDayOfLastMonth && recordDate < firstDayOfCurrentMonth;
    });

    const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const totalExpense = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    return {
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate,
        monthLabel: `${lastMonthYear}年${lastMonthMonth + 1}月`
    };
}, [cashflowRecords]);

  const assetPercentages = total > 0 ? breakdown.map(asset => ({
    type: asset.type,
    percentage: (asset.value / total) * 100
  })) : [];
  
  const investmentMetrics = useMemo(() => {
    const allInvestmentAssets = assetAccounts.flatMap(acc => acc.assets || []).filter(asset => asset.accountType === '股票' || asset.accountType === 'ETF');
    const numberOfAssets = allInvestmentAssets.length;
    
    const totalInvestmentValue = allInvestmentAssets.reduce((sum, asset) => sum + (asset.currentValueTWD || 0), 0);
    
    const topAsset = numberOfAssets > 0 ? [...allInvestmentAssets].sort((a,b) => (b.currentValueTWD ?? 0) - (a.currentValueTWD ?? 0))[0] : null;
    
    const concentration = totalInvestmentValue > 0 && topAsset ? ((topAsset.currentValueTWD ?? 0) / totalInvestmentValue) * 100 : 0;
    
    return { numberOfAssets, concentration };
  }, [assetAccounts]);


  const averageMonthlyExpense = useMemo(() => {
    const expenseRecords = cashflowRecords.filter(r => r.type === 'expense');
    if (expenseRecords.length === 0) return 0;

    // Group expenses by month to get a monthly total
    const months = new Map<string, number>();
    expenseRecords.forEach(record => {
        const monthKey = record.date.slice(0, 7); // 'YYYY-MM'
        months.set(monthKey, (months.get(monthKey) || 0) + record.amount);
    });
    
    // If there are no months with expenses, return 0
    if (months.size === 0) return 0;

    // Calculate the average of all monthly totals
    const totalExpenseOverAllMonths = Array.from(months.values()).reduce((sum, amount) => sum + amount, 0);
    return totalExpenseOverAllMonths / months.size;
  }, [cashflowRecords]);
  

  const getAssetHealthLight = () => {
    if (total === 0) return { label: '無數據', color: 'text-gray-500', subtitle: '請先新增資產' };
    
    const stockPercentage = assetPercentages.find(a => a.type === '股票')?.percentage || 0;
    const { concentration, numberOfAssets } = investmentMetrics;
    const totalCash = breakdown.find(b => b.type === '現金')?.value || 0;
    const cashMonths = averageMonthlyExpense > 0 ? totalCash / averageMonthlyExpense : 0;

    // Red light conditions (high risk) - ordered by severity
    if (concentration > 50) {
      return { label: '紅燈', color: 'text-red-500', subtitle: '風險過度集中' };
    }
    if (stockPercentage > 60) {
      return { label: '紅燈', color: 'text-red-500', subtitle: '個股佔比極高' };
    }
     if (averageMonthlyExpense > 0 && cashMonths < 1) {
      return { label: '紅燈', color: 'text-red-500', subtitle: '緊急備用金嚴重不足' };
    }

    // Yellow light conditions (moderate risk/needs attention) - ordered by severity
    if (concentration > 30) {
        return { label: '黃燈', color: 'text-yellow-500', subtitle: '單一資產佔比較高' };
    }
    if (stockPercentage > 35) {
        return { label: '黃燈', color: 'text-yellow-500', subtitle: '個股佔比偏高' };
    }
    if (numberOfAssets > 0 && numberOfAssets < 4) {
        return { label: '黃燈', color: 'text-yellow-500', subtitle: '投資標的較少' };
    }
    if (averageMonthlyExpense > 0 && cashMonths < 3) {
      return { label: '黃燈', color: 'text-yellow-500', subtitle: '緊急備用金可能不足' };
    }
    if (cashMonths > 12) {
        return { label: '黃燈', color: 'text-yellow-500', subtitle: '現金持有過多，可考慮投資' };
    }
    if (total < 500000) {
        return { label: '黃燈', color: 'text-yellow-500', subtitle: '總資產規模較小' };
    }

    // Green light (good health)
    return { label: '綠燈', color: 'text-green-500', subtitle: '資產配置穩健' };
  };

  const getConcentrationAnalysis = () => {
    if (total === 0) return '無數據可分析。';
    const stockValue = breakdown.find(a => a.type === '股票')?.value || 0;
    const etfValue = breakdown.find(a => a.type === 'ETF')?.value || 0;
    const cashValue = breakdown.find(a => a.type === '現金')?.value || 0;

    if (stockValue / total > 0.5) return '過度集中於高風險股票，請注意分散風險！';
    if (etfValue / total > 0.8) return 'ETF 配置良好，但仍需考量分散性。';
    if (cashValue / total > 0.4) return '現金持有比例較高，可考慮適度配置到投資項目。';
    return '資產配置分散良好。';
  };

  const getEtfRecommendation = () => {
    if (total === 0) return '無數據可提供建議。';
    const stockPercentage = assetPercentages.find(a => a.type === '股票')?.percentage || 0;
    const etfPercentage = assetPercentages.find(a => a.type === 'ETF')?.percentage || 0;

    if (stockPercentage > 25 && etfPercentage < 50) return '建議降低高風險股票比重，增加指數型 ETF 投資以分散風險。';
    if (etfPercentage < 40) return '建議增加指數型 ETF 的配置，建立穩健的投資基礎。';
    return '您的 ETF 配置相對均衡，繼續保持！';
  };
  
  const getBuffettComparison = () => {
    if (total === 0) return '無數據可進行比對。';
    const currentEtfPercentage = (breakdown.find(a => a.type === 'ETF')?.value || 0) / total;
    const currentCashPercentage = (breakdown.find(a => a.type === '現金')?.value || 0) / total;

    const etfDiff = currentEtfPercentage - BUFFETT_TARGET.etf;
    const cashDiff = currentCashPercentage - BUFFETT_TARGET.cash;

    if (Math.abs(etfDiff) < 0.1 && Math.abs(cashDiff) < 0.05) {
        return '您的資產配置與巴菲特「90% ETF + 10% 現金」模型非常接近，表現出色！';
    }
    let recommendation = '您的資產配置與巴菲特模型存在偏差。';
    if (etfDiff < 0) recommendation += ` 建議增加 ETF 約 ${(-etfDiff * 100).toFixed(1)}%。`;
    if (cashDiff > 0.1) recommendation += ' 您的現金比重過高，可考慮投入投資。';
    return recommendation;
  };

  useEffect(() => {
    if (chartRef.current && total > 0) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      const ctx = chartRef.current.getContext('2d');
      if(ctx) {
        chartInstance.current = new Chart(ctx, {
            type: 'pie',
            data: {
              labels: breakdown.map(asset => asset.type),
              datasets: [{
                data: breakdown.map(asset => asset.value),
                backgroundColor: breakdown.map(asset => asset.color),
                borderColor: '#fff',
                borderWidth: 2,
                hoverOffset: 8
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'right', labels: { font: { size: 14, family: 'Inter, sans-serif' }, color: '#333' } },
                title: { display: true, text: '資產配置圓餅圖', font: { size: 18, family: 'Inter, sans-serif' }, color: '#333' }
              }
            }
          });
      }
    } else if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [total, breakdown]);
  
  const healthStatus = getAssetHealthLight();

  return (
    <div>
      <PageHeader title="您的個人財務導航中心" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-xl shadow-lg text-white transform hover:scale-105 transition-transform duration-300 relative overflow-hidden">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="relative z-10">
                <h3 className="text-xl font-semibold mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 mr-2 opacity-75">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                    總資產顯示
                </h3>
                <p className="text-4xl font-bold mt-4">${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                <p className="text-blue-200 text-sm mt-2">包含所有帳戶資產</p>
            </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-xl shadow-lg text-white transform hover:scale-105 transition-transform duration-300 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="relative z-10">
                <h3 className="text-xl font-semibold mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 mr-2 opacity-75">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    美元資產總值 (TWD)
                </h3>
                <p className="text-4xl font-bold mt-4">${totalUsdAssetsInTwd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                <p className="text-emerald-100 text-sm mt-2">已轉換為新台幣</p>
            </div>
        </div>
        <Card>
          <div className="flex items-center mb-3 space-x-2">
            <h3 className="text-lg font-semibold text-gray-800">資產健康燈</h3>
            {(healthStatus.label === '黃燈' || healthStatus.label === '紅燈') && (
              <div className="relative flex items-center group cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${healthStatus.label === '黃燈' ? 'text-yellow-500' : 'text-red-500'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-xs text-white bg-gray-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                  {healthStatus.subtitle}
                  <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                </div>
              </div>
            )}
          </div>
          <p className={`text-4xl font-bold ${healthStatus.color}`}>{healthStatus.label}</p>
          <p className="text-gray-500 text-sm mt-2 h-10">{healthStatus.subtitle}</p>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">集中度分析</h3>
          <p className="text-gray-700 mt-2 text-base font-medium">{getConcentrationAnalysis()}</p>
        </Card>
      </div>
      
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">{lastMonthSummary.monthLabel} 財務摘要</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-green-50 border-green-200">
                <h4 className="text-md font-semibold text-green-800 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    總收入
                </h4>
                <p className="text-3xl font-bold text-green-900">${lastMonthSummary.totalIncome.toLocaleString()}</p>
            </Card>
            <Card className="bg-red-50 border-red-200">
                <h4 className="text-md font-semibold text-red-800 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    總支出
                </h4>
                <p className="text-3xl font-bold text-red-900">${lastMonthSummary.totalExpense.toLocaleString()}</p>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
                <h4 className="text-md font-semibold text-blue-800 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
                    淨儲蓄
                </h4>
                <p className={`text-3xl font-bold ${lastMonthSummary.netSavings >= 0 ? 'text-blue-900' : 'text-red-900'}`}>${lastMonthSummary.netSavings.toLocaleString()}</p>
            </Card>
             <Card className="bg-purple-50 border-purple-200">
                <h4 className="text-md font-semibold text-purple-800 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    儲蓄率
                </h4>
                <p className="text-3xl font-bold text-purple-900">{lastMonthSummary.savingsRate.toFixed(1)}%</p>
            </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="h-[450px]">
          {total > 0 ? (
            <canvas ref={chartRef}></canvas>
          ) : (
            <div className="text-center flex flex-col items-center justify-center h-full text-gray-500">
                <p className="mb-4 text-lg">尚無資產數據可顯示圖表。</p>
                <p>請至「資料管理」新增您的資產。</p>
            </div>
          )}
        </Card>
        <div className="flex flex-col gap-6">
            <Card>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">ETF 建議卡</h3>
                <p className="text-gray-600 text-base leading-relaxed">{getEtfRecommendation()}</p>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
                <h4 className="text-lg font-semibold text-blue-800 mb-2">巴菲特配置比對</h4>
                <p className="text-gray-700 text-base leading-relaxed">{getBuffettComparison()}</p>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
