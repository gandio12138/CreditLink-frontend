# CreditLink Frontend

CreditLink 链上信用借贷协议前端应用。

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **Web3**: wagmi + viem
- **状态管理**: Zustand
- **钱包连接**: RainbowKit

## 功能特性

- 连接钱包 (MetaMask, WalletConnect 等)
- 存款/取款操作
- 借款/还款操作
- 信用评分展示
- 资产市场概览
- 持仓管理
- 炫酷的 UI 动画效果

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 环境配置

复制 `.env.example` 为 `.env`，并填入本次 Sepolia Ignition 部署输出的地址：

```env
VITE_WALLET_CONNECT_PROJECT_ID=your-project-id
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_SEPOLIA_LENDING_POOL_ADDRESS=0x...
VITE_SEPOLIA_RISK_REGISTRY_ADDRESS=0x...
VITE_SEPOLIA_PRICE_ORACLE_ADDRESS=0x...
VITE_SEPOLIA_INCENTIVE_CONTROLLER_ADDRESS=0x...
VITE_SEPOLIA_TREASURY_ADDRESS=0x...
VITE_SEPOLIA_USDC_ADDRESS=0x...
VITE_SEPOLIA_WETH_ADDRESS=0x...
```

地址缺失、非法或为零地址时，Sepolia 链上读取和交易会保持禁用；前端不会回退到旧部署或本地地址。当前真实 Feed 部署仅启用 USDC 与 WETH，USDT/WBTC 变量应留空。

## 项目结构

```
src/
├── components/     # React 组件
│   ├── common/     # 通用组件 (Header, Layout, ConnectButton)
│   ├── credit/     # 信用相关组件
│   ├── dashboard/  # 仪表盘组件
│   └── modals/     # 模态框组件
├── hooks/          # 自定义 Hooks
├── pages/          # 页面组件
├── services/       # API 服务
├── store/          # Zustand 状态管理
├── types/          # TypeScript 类型定义
└── utils/          # 工具函数
```

## License

MIT
