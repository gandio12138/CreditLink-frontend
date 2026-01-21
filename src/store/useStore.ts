import { create } from 'zustand';
import type { CreditInfo, MarketData, AccountData, UserPositions } from '../types';

// ==================== 用户状态 ====================

interface UserState {
  // 账户数据
  accountData: AccountData | null;
  setAccountData: (data: AccountData | null) => void;

  // 持仓数据
  positions: UserPositions | null;
  setPositions: (data: UserPositions | null) => void;

  // 信用数据
  creditInfo: CreditInfo | null;
  setCreditInfo: (data: CreditInfo | null) => void;

  // 是否已认证
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;

  // 清除所有用户数据
  clearUserData: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  accountData: null,
  setAccountData: (data) => set({ accountData: data }),

  positions: null,
  setPositions: (data) => set({ positions: data }),

  creditInfo: null,
  setCreditInfo: (data) => set({ creditInfo: data }),

  isAuthenticated: false,
  setIsAuthenticated: (value) => set({ isAuthenticated: value }),

  clearUserData: () =>
    set({
      accountData: null,
      positions: null,
      creditInfo: null,
      isAuthenticated: false,
    }),
}));

// ==================== 市场状态 ====================

interface MarketState {
  // 市场数据列表
  markets: MarketData[];
  setMarkets: (data: MarketData[]) => void;

  // 选中的市场
  selectedMarket: MarketData | null;
  setSelectedMarket: (market: MarketData | null) => void;

  // 是否正在加载
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  markets: [],
  setMarkets: (data) => set({ markets: data }),

  selectedMarket: null,
  setSelectedMarket: (market) => set({ selectedMarket: market }),

  isLoading: false,
  setIsLoading: (value) => set({ isLoading: value }),
}));

// ==================== UI状态 ====================

interface ModalState {
  // 存款弹窗
  isDepositModalOpen: boolean;
  depositAsset: string | null;
  openDepositModal: (asset: string) => void;
  closeDepositModal: () => void;

  // 提款弹窗
  isWithdrawModalOpen: boolean;
  withdrawAsset: string | null;
  openWithdrawModal: (asset: string) => void;
  closeWithdrawModal: () => void;

  // 借款弹窗
  isBorrowModalOpen: boolean;
  borrowAsset: string | null;
  openBorrowModal: (asset: string) => void;
  closeBorrowModal: () => void;

  // 还款弹窗
  isRepayModalOpen: boolean;
  repayAsset: string | null;
  openRepayModal: (asset: string) => void;
  closeRepayModal: () => void;

  // 信用详情弹窗
  isCreditDetailModalOpen: boolean;
  openCreditDetailModal: () => void;
  closeCreditDetailModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  // 存款
  isDepositModalOpen: false,
  depositAsset: null,
  openDepositModal: (asset) => set({ isDepositModalOpen: true, depositAsset: asset }),
  closeDepositModal: () => set({ isDepositModalOpen: false, depositAsset: null }),

  // 提款
  isWithdrawModalOpen: false,
  withdrawAsset: null,
  openWithdrawModal: (asset) => set({ isWithdrawModalOpen: true, withdrawAsset: asset }),
  closeWithdrawModal: () => set({ isWithdrawModalOpen: false, withdrawAsset: null }),

  // 借款
  isBorrowModalOpen: false,
  borrowAsset: null,
  openBorrowModal: (asset) => set({ isBorrowModalOpen: true, borrowAsset: asset }),
  closeBorrowModal: () => set({ isBorrowModalOpen: false, borrowAsset: null }),

  // 还款
  isRepayModalOpen: false,
  repayAsset: null,
  openRepayModal: (asset) => set({ isRepayModalOpen: true, repayAsset: asset }),
  closeRepayModal: () => set({ isRepayModalOpen: false, repayAsset: null }),

  // 信用详情
  isCreditDetailModalOpen: false,
  openCreditDetailModal: () => set({ isCreditDetailModalOpen: true }),
  closeCreditDetailModal: () => set({ isCreditDetailModalOpen: false }),
}));

// ==================== 通知状态 ====================

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: Date.now().toString() },
      ],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
}));

// ==================== 健康因子预警状态 ====================

interface HealthAlertState {
  // 当前健康因子
  currentHealthFactor: string | null;
  setCurrentHealthFactor: (value: string | null) => void;

  // 预警阈值
  alertThreshold: string;
  setAlertThreshold: (value: string) => void;

  // 是否显示预警
  showAlert: boolean;
  setShowAlert: (value: boolean) => void;
}

export const useHealthAlertStore = create<HealthAlertState>((set) => ({
  currentHealthFactor: null,
  setCurrentHealthFactor: (value) => set({ currentHealthFactor: value }),

  alertThreshold: '1.15',
  setAlertThreshold: (value) => set({ alertThreshold: value }),

  showAlert: false,
  setShowAlert: (value) => set({ showAlert: value }),
}));
