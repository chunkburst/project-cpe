# NCM 模式崩溃分析与前端更新说明

## NCM 模式切换后30秒崩溃分析

### 问题现象
NCM 模式（mode 1: CDC-NCM + ADB）切换后，前30秒工作正常，30秒后服务崩溃。

### 根因分析

#### 触发链路

```
USB 热切换到 NCM
│
├─ switch_usb_mode_advanced(mode=1)
│  ├─ set_usb_share_mode(true) → 直接写 /dev/stty_lte30
│  │  └─ 绕过 ofono，与 ofono 的 D-Bus 操作底层冲突
│  │
│  ├─ configure_usb_network()
│  │  ├─ connmanctl tether gadget on → 添加 iptables NAT 规则
│  │  ├─ ifconfig usb0 up → 网络接口就绪
│  │  └─ SFP 加速启用
│  │
│  └─ 总计 2.5 秒的 thread::sleep 阻塞 tokio worker
│
├─ 前 30 秒：网络正常
│  └─ connman 刚配置好 NAT，watchdog 尚未触发
│
├─ 30 秒后（旧 watchdog 5s 间隔时更早触发）
│  ├─ watchdog: iptables -F → 清空 connman 刚添加的 NAT 规则
│  ├─ connman: 检测到规则丢失 → 重新添加
│  ├─ watchdog: find_internet_context() → 未序列化 → InProgress 错误
│  ├─ ofono: 状态混乱（直接被写串口 + D-Bus 操作冲突）
│  └─ 正反馈循环 → 服务崩溃
│
└─ 3 小时后 → 进程 OOM 或 D-Bus 超时积累到临界点 → 进程终止
```

### 已实施的修复

1. **移除 `set_usb_share_mode` 调用** - 不再直接写入 `/dev/stty_lte30`，USB 共享由 connman gadget tethering 管理
2. **Watchdog 不再刷新 iptables** - 保护 connman 的 NAT 规则不被干扰
3. **Watchdog 间隔从 5s 增加到 30s** - 减少 D-Bus 操作频率
4. **`find_internet_context` 加锁** - 防止 InProgress 冲突
5. **USB 切换使用 `spawn_blocking`** - 避免阻塞 tokio worker
6. **D-Bus 锁超时从 5s 增加到 15s** - 允许正在进行的操作完成
7. **任务 panic 恢复** - 所有后台任务自动重启
8. **MessageStream 指数退避** - 错误时逐渐增加重试间隔

---

## NCM 模式对比

| 属性 | Mode 1 (CDC-NCM + ADB) | Mode 4 (NCM No ADB) |
|------|------------------------|---------------------|
| 网络协议 | CDC-NCM | CDC-NCM |
| VID:PID | 0x1782:0x4040 | 0x3426:0x2999 |
| ADB 调试 | 启用 | 禁用 |
| 串口 | gser.gs0-gs7 + vser | gser.gs0-gs7 + vser |
| USB 共享 | connman 管理 | 无额外共享 |
| IPA 协议 | NCM | NCM |
| 安全性 | 低（调试接口开放） | 高（无调试接口） |

---

## 前端更新

### 变更内容
1. USB 模式选择器新增 "NCM (No ADB)" 选项 (mode 4)
2. `getModeNameByValue` 函数支持 mode 4
3. TypeScript 类型注释更新

### API 变更
- `POST /api/usb-mode` 和 `POST /api/usb-advance` 现在接受 mode=4
- `GET /api/usb-mode` 返回的 `current_mode_name` 现在支持 "NCM (No ADB)"
