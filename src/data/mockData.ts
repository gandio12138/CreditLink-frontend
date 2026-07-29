/** Credit factor mappings used by the profile visualization. */

import type { CreditInfo } from '../types';

// 信用维度映射 - 将 API 返回的 factor key 映射到展示维度
export const CREDIT_FACTOR_MAPPING: Record<string, { dimension: string; label: string; icon: string }> = {
  repayment_bonus: { dimension: 'repayment', label: '还款能力', icon: '💰' },
  liquidation_penalty: { dimension: 'repayment', label: '还款能力', icon: '💰' },
  borrow_history_bonus: { dimension: 'history', label: '历史记录', icon: '📈' },
  loyalty_bonus: { dimension: 'onchain', label: '链上行为', icon: '⛓️' },
  health_factor_bonus: { dimension: 'repayment', label: '还款能力', icon: '💰' },
  wallet_age_bonus: { dimension: 'history', label: '历史记录', icon: '📈' },
  activity_bonus: { dimension: 'onchain', label: '链上行为', icon: '⛓️' },
  diversity_bonus: { dimension: 'assets', label: '资产规模', icon: '📊' },
  net_worth_bonus: { dimension: 'assets', label: '资产规模', icon: '📊' },
};

// 信用维度配置
export const CREDIT_DIMENSIONS = [
  { key: 'repayment', label: '还款能力', icon: '💰', maxScore: 100 },
  { key: 'assets', label: '资产规模', icon: '📊', maxScore: 100 },
  { key: 'onchain', label: '链上行为', icon: '⛓️', maxScore: 100 },
  { key: 'history', label: '历史记录', icon: '📈', maxScore: 100 },
];

// 将 API 返回的 factors 转换为维度分数
export function calculateDimensionScores(factors: CreditInfo['factors']): Record<string, number> {
  const scores: Record<string, number> = {
    repayment: 50, // 基础分
    assets: 50,
    onchain: 50,
    history: 50,
  };

  factors.forEach((factor) => {
    const mapping = CREDIT_FACTOR_MAPPING[factor.key];
    if (mapping) {
      scores[mapping.dimension] = Math.min(100, scores[mapping.dimension] + factor.contribution / 2);
    }
  });

  return scores;
}
