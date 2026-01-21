import type {
  AccountData,
  UserPositions,
  ActivityRecord,
  CreditInfo,
  SignRequest,
  SignResponse,
  RiskParams,
  RiskParamsResponse,
  NonceResponse,
  LoginResponse,
  ApiResponse,
} from '../types';

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// 存储token的key
const TOKEN_KEY = 'creditlink_token';

// 获取存储的token
function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// 存储token
function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

// 清除token
function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// 通用请求函数
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.error || `请求失败: ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : '网络请求失败' };
  }
}

// ==================== 认证相关API ====================

// 获取登录nonce
export async function getNonce(wallet: string): Promise<ApiResponse<NonceResponse>> {
  return request<NonceResponse>(`/auth/nonce?wallet=${wallet}`);
}

// 登录
export async function login(
  wallet: string,
  signature: string,
  message: string
): Promise<ApiResponse<LoginResponse>> {
  const result = await request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ walletAddress: wallet, signature, message }),
  });

  if (result.data?.token) {
    setToken(result.data.token);
  }

  return result;
}

// 登出
export function logout(): void {
  clearToken();
}

// 检查是否已登录
export function isAuthenticated(): boolean {
  return !!getToken();
}

// ==================== 用户相关API ====================

// 获取用户账户数据
export async function getAccount(): Promise<ApiResponse<AccountData>> {
  return request<AccountData>('/user/account');
}

// 获取用户持仓
export async function getPositions(): Promise<ApiResponse<UserPositions>> {
  return request<UserPositions>('/user/positions');
}

// 获取用户活动记录
export async function getActivities(): Promise<ApiResponse<{ activities: ActivityRecord[] }>> {
  return request<{ activities: ActivityRecord[] }>('/user/activities');
}

// ==================== 信用相关API ====================

// 获取用户信用信息
export async function getCredit(): Promise<ApiResponse<CreditInfo>> {
  return request<CreditInfo>('/user/credit');
}

// 刷新信用分
export async function refreshCredit(): Promise<ApiResponse<{ score: number; tier: string; message: string }>> {
  return request<{ score: number; tier: string; message: string }>('/user/credit/refresh', {
    method: 'POST',
  });
}

// 请求信用借款签名
export async function requestCreditSign(
  params: SignRequest
): Promise<ApiResponse<SignResponse>> {
  return request<SignResponse>('/credit/sign', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ==================== 风险参数API ====================

// 获取所有风险参数
export async function getRiskParams(): Promise<ApiResponse<RiskParamsResponse>> {
  return request<RiskParamsResponse>('/risk/params');
}

// 获取特定资产的风险参数
export async function getAssetRiskParams(asset: string): Promise<ApiResponse<RiskParams>> {
  return request<RiskParams>(`/risk/params/${asset}`);
}

// ==================== WebSocket连接 ====================

// 健康因子预警WebSocket
export function connectHealthAlert(
  wallet: string,
  onMessage: (data: { healthFactor: string; threshold: string }) => void,
  onError?: (error: Event) => void
): WebSocket {
  const wsUrl = API_BASE_URL.replace('http', 'ws').replace('/api/v1', '/api/v1/ws');
  const ws = new WebSocket(`${wsUrl}/health-alert?wallet=${wallet}`);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('解析WebSocket消息失败:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket错误:', error);
    onError?.(error);
  };

  return ws;
}

// 导出API实例
export const api = {
  // 认证
  getNonce,
  login,
  logout,
  isAuthenticated,
  // 用户
  getAccount,
  getPositions,
  getActivities,
  // 信用
  getCredit,
  refreshCredit,
  requestCreditSign,
  // 风险
  getRiskParams,
  getAssetRiskParams,
  // WebSocket
  connectHealthAlert,
};

export default api;
