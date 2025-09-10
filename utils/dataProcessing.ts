

import { AssetAccount, Asset } from '../types';
import { ASSET_TYPE_COLORS } from '../constants';

export const processAssetAccounts = (accounts: AssetAccount[], usdToTwdRate: number): AssetAccount[] => {
  return accounts.map(account => ({
    ...account,
    assets: (account.assets || []).map(asset => {
      const value = parseFloat(String(asset.currentValue)) || 0;
      const cost = parseFloat(String(asset.cost)) || 0;
      const units = parseFloat(String(asset.units)) || 0;
      const rate = asset.currency === 'USD' ? usdToTwdRate : 1;
      
      const currentValueTWD = value * units * rate;
      const costTWD = cost * units * rate;
      const profitLossTWD = currentValueTWD - costTWD;

      return { ...asset, currentValueTWD, costTWD, profitLossTWD };
    })
  }));
};

interface AssetSummary {
    total: number;
    breakdown: {
        type: string;
        value: number;
        color: string;
    }[];
    totalUsdAssetsInTwd: number;
}

export const calculateAssetSummary = (assetAccounts: AssetAccount[]): AssetSummary => {
    let total = 0;
    const breakdownMap: { [key: string]: { value: number; color: string } } = {
        '現金': { value: 0, color: ASSET_TYPE_COLORS['現金'] },
        'ETF': { value: 0, color: ASSET_TYPE_COLORS['ETF'] },
        '股票': { value: 0, color: ASSET_TYPE_COLORS['股票'] },
        '不動產': { value: 0, color: ASSET_TYPE_COLORS['不動產'] },
        '美元資產': { value: 0, color: ASSET_TYPE_COLORS['美元資產'] }
    };

    assetAccounts.forEach(account => {
        (account.assets || []).forEach((asset: Asset) => {
            const valueInTWD = asset.currentValueTWD || 0;
            total += valueInTWD;
            if (breakdownMap[asset.accountType]) {
                breakdownMap[asset.accountType].value += valueInTWD;
            }
        });
    });

    const breakdown = Object.keys(breakdownMap)
        .filter(key => breakdownMap[key].value > 0)
        .map(key => ({
            type: key,
            value: breakdownMap[key].value,
            color: breakdownMap[key].color
        }));

    const totalUsdAssetsInTwd = breakdownMap['美元資產'].value;

    return { total, breakdown, totalUsdAssetsInTwd };
};