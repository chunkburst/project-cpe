/*
 * @Author: 1orz cloudorzi@gmail.com
 * @Date: 2025-12-10 10:15:57
 * @LastEditors: 1orz cloudorzi@gmail.com
 * @LastEditTime: 2025-12-13 12:44:40
 * @FilePath: /udx710-backend/frontend/src/pages/Dashboard/hooks/useDashboardData.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by 1orz, All Rights Reserved. 
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import { api } from '@/api'
import type {
  DeviceInfo,
  NetworkInfo,
  CellsResponse,
  QosInfo,
  SimInfo,
  SystemStatsResponse,
  AirplaneModeResponse,
  ImsStatusResponse,
  RoamingResponse,
} from '@/api/types'

// 网速历史记录的最大数据点数
export const SPEED_HISTORY_MAX_POINTS = 30

// 单个接口的速度历史类型
export interface InterfaceSpeedHistory {
  rx: number[]
  tx: number[]
  totalRx: number
  totalTx: number
}

export interface ConnectivityResult {
  ipv4: { success: boolean; latency_ms?: number }
  ipv6: { success: boolean; latency_ms?: number }
}

export interface DashboardData {
  deviceInfo: DeviceInfo | null
  simInfo: SimInfo | null
  systemStats: SystemStatsResponse | null
  networkInfo: NetworkInfo | null
  dataStatus: boolean
  cellsInfo: CellsResponse | null
  qosInfo: QosInfo | null
  airplaneMode: AirplaneModeResponse | null
  imsStatus: ImsStatusResponse | null
  connectivity: ConnectivityResult | null
  speedHistory: Record<string, InterfaceSpeedHistory>
  roaming: RoamingResponse | null
}

export interface DashboardActions {
  toggleData: () => Promise<void>
  toggleAirplaneMode: () => Promise<void>
  toggleRoaming: () => Promise<void>
  loadData: () => Promise<void>
}

export function useDashboardData(refreshInterval: number, refreshKey: number) {
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 数据状态
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [simInfo, setSimInfo] = useState<SimInfo | null>(null)
  const [systemStats, setSystemStats] = useState<SystemStatsResponse | null>(null)
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null)
  const [dataStatus, setDataStatus] = useState(false)
  const [cellsInfo, setCellsInfo] = useState<CellsResponse | null>(null)
  const [qosInfo, setQosInfo] = useState<QosInfo | null>(null)
  const [airplaneMode, setAirplaneMode] = useState<AirplaneModeResponse | null>(null)
  const [imsStatus, setImsStatus] = useState<ImsStatusResponse | null>(null)
  const [connectivity, setConnectivity] = useState<ConnectivityResult | null>(null)
  const [roaming, setRoaming] = useState<RoamingResponse | null>(null)

  // 网速历史记录
  const [speedHistory, setSpeedHistory] = useState<Record<string, InterfaceSpeedHistory>>({})
  const speedHistoryRef = useRef<Record<string, InterfaceSpeedHistory>>({})

  // 更新速度历史记录
  const updateSpeedHistory = useCallback((stats: SystemStatsResponse | null) => {
    if (!stats?.network_speed?.interfaces) return

    const newHistory = { ...speedHistoryRef.current }
    
    for (const iface of stats.network_speed.interfaces) {
      const existing = newHistory[iface.interface] || { rx: [], tx: [], totalRx: 0, totalTx: 0 }
      
      const rxHistory = [...existing.rx, iface.rx_bytes_per_sec]
      const txHistory = [...existing.tx, iface.tx_bytes_per_sec]
      
      if (rxHistory.length > SPEED_HISTORY_MAX_POINTS) {
        rxHistory.shift()
        txHistory.shift()
      }
      
      newHistory[iface.interface] = {
        rx: rxHistory,
        tx: txHistory,
        totalRx: iface.total_rx_bytes,
        totalTx: iface.total_tx_bytes,
      }
    }
    
    speedHistoryRef.current = newHistory
    setSpeedHistory(newHistory)
  }, [])

  // 加载数据 - 每个 API 调用独立容错，单个失败不影响其他数据
  const loadData = useCallback(async () => {
    setError(null)
    try {
      // 核心数据 - 独立处理每个结果
      const coreResults = await Promise.allSettled([
        api.getDeviceInfo(),
        api.getSimInfo(),
        api.getSystemStats(),
        api.getNetworkInfo(),
        api.getDataStatus(),
        api.getCellsInfo(),
        api.getQosInfo(),
        api.getAirplaneMode(),
      ])

      // 安全提取数据
      const [deviceRes, simRes, statsRes, networkRes, dataRes, cellsRes, qosRes, airplaneModeRes] =
        coreResults.map(r => (r.status === 'fulfilled' ? r.value : null))

      if (deviceRes?.data) setDeviceInfo(deviceRes.data)
      if (simRes?.data) setSimInfo(simRes.data)
      if (statsRes?.data) {
        setSystemStats(statsRes.data)
        updateSpeedHistory(statsRes.data)
      }
      if (networkRes?.data) setNetworkInfo(networkRes.data)
      if (dataRes?.data) setDataStatus(dataRes.data.active)
      if (cellsRes?.data) setCellsInfo(cellsRes.data)
      if (qosRes?.data) setQosInfo(qosRes.data)
      if (airplaneModeRes?.data) setAirplaneMode(airplaneModeRes.data)

      // 扩展数据 - 独立容错
      try {
        const extResults = await Promise.allSettled([
          api.getImsStatus(),
          api.getConnectivity(),
          api.getRoamingStatus(),
        ])
        const [imsRes, connectivityRes, roamingRes] =
          extResults.map(r => (r.status === 'fulfilled' ? r.value : null))
        if (imsRes?.data) setImsStatus(imsRes.data)
        if (connectivityRes?.data) setConnectivity(connectivityRes.data)
        if (roamingRes?.data) setRoaming(roamingRes.data)
      } catch {
        // 扩展数据加载失败不阻塞主流程
      }
    } catch (err) {
      // 仅在所有核心调用完全失败时才报错
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setInitialLoading(false)
    }
  }, [updateSpeedHistory])

  // 切换数据连接
  const toggleData = useCallback(async () => {
    try {
      const newStatus = !dataStatus
      await api.setDataStatus(newStatus)
      setDataStatus(newStatus)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [dataStatus])

  // 切换飞行模式
  const toggleAirplaneMode = useCallback(async () => {
    try {
      const newEnabled = !airplaneMode?.enabled
      const response = await api.setAirplaneMode(newEnabled)
      if (response.data) {
        setAirplaneMode(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [airplaneMode?.enabled])

  // 切换漫游
  const toggleRoaming = useCallback(async () => {
    try {
      const newAllowed = !roaming?.roaming_allowed
      const response = await api.setRoamingAllowed(newAllowed)
      if (response.data) {
        setRoaming(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [roaming?.roaming_allowed])

  // 自动刷新
  useEffect(() => {
    void loadData()
    if (refreshInterval > 0) {
      const interval = setInterval(() => void loadData(), refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshInterval, refreshKey, loadData])

  return {
    initialLoading,
    error,
    setError,
    data: {
      deviceInfo,
      simInfo,
      systemStats,
      networkInfo,
      dataStatus,
      cellsInfo,
      qosInfo,
      airplaneMode,
      imsStatus,
      connectivity,
      speedHistory,
      roaming,
    } as DashboardData,
    actions: {
      toggleData,
      toggleAirplaneMode,
      toggleRoaming,
      loadData,
    } as DashboardActions,
  }
}
