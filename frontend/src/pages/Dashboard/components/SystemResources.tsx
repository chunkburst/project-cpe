/*
 * @Author: 1orz cloudorzi@gmail.com
 * @Date: 2025-12-10 10:17:25
 * @LastEditors: 1orz cloudorzi@gmail.com
 * @LastEditTime: 2025-12-13 12:44:35
 * @FilePath: /udx710-backend/frontend/src/pages/Dashboard/components/SystemResources.tsx
 * @Description: 
 * 
 * Copyright (c) 2025 by 1orz, All Rights Reserved. 
 */
import { useState } from 'react'
import { Box, Card, CardContent, Typography, Stack, LinearProgress, Chip, Tooltip, Collapse, IconButton } from '@mui/material'
import { Speed, Memory, Storage, Thermostat, Usb, Info, ExpandMore, ExpandLess } from '@mui/icons-material'
import { formatBytes, getCpuColor, getMemoryColor, getTempColor } from '../utils'
import type { SystemStatsResponse } from '@/api/types'

interface SystemResourcesProps {
  systemStats: SystemStatsResponse | null
}

export function SystemResources({ systemStats }: SystemResourcesProps) {
  const [diskExpanded, setDiskExpanded] = useState(false)

  const getMainTemp = () => {
    if (systemStats?.temperature && systemStats.temperature.length > 0) {
      const socSensor = systemStats.temperature.find(s => s.type.includes('soc'))
      return socSensor?.temperature || systemStats.temperature[0].temperature
    }
    return null
  }

  const mainTemp = getMainTemp()

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          系统资源
        </Typography>
        <Stack spacing={1.5}>
          {/* CPU 负载 */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Speed fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  CPU ({systemStats?.cpu_load?.core_count || '-'}核)
                </Typography>
              </Box>
              <Typography variant="caption" fontWeight={600}>
                {systemStats?.cpu_load ? `${systemStats.cpu_load.load_percent.toFixed(0)}%` : '-'}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={systemStats?.cpu_load?.load_percent || 0}
              color={getCpuColor(systemStats?.cpu_load?.load_percent || 0)}
              sx={{ height: 4, borderRadius: 2 }}
            />
          </Box>

          {/* 内存 */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Memory fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">内存</Typography>
              </Box>
              <Typography variant="caption" fontWeight={600}>
                {systemStats?.memory ? `${systemStats.memory.used_percent.toFixed(0)}%` : '-'}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={systemStats?.memory?.used_percent || 0}
              color={getMemoryColor(systemStats?.memory?.used_percent || 0)}
              sx={{ height: 4, borderRadius: 2 }}
            />
            {systemStats?.memory && (
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                {formatBytes(systemStats.memory.used_bytes)} / {formatBytes(systemStats.memory.total_bytes)}
              </Typography>
            )}
          </Box>

          {/* 磁盘空间 - 可折叠 */}
          {systemStats?.disk && systemStats.disk.length > 0 && (
            <Box>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                onClick={() => setDiskExpanded(!diskExpanded)}
                sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
              >
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Storage fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">磁盘</Typography>
                  <Chip
                    label={systemStats.disk.length}
                    size="small"
                    sx={{ height: 16, fontSize: '0.6rem' }}
                  />
                </Box>
                <IconButton size="small" sx={{ p: 0 }}>
                  {diskExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                </IconButton>
              </Box>
              <Collapse in={diskExpanded}>
                <Stack spacing={0.5} mt={0.5}>
                  {systemStats.disk.map((disk, idx) => (
                    <Box key={idx}>
                      <Box display="flex" justifyContent="space-between" mb={0.25}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontFamily: 'monospace' }}>
                          {disk.mount_point}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', fontFamily: 'monospace' }}>
                          {disk.used_percent.toFixed(0)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={disk.used_percent}
                        color={getMemoryColor(disk.used_percent)}
                        sx={{ height: 3, borderRadius: 1.5 }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Collapse>
            </Box>
          )}

          {/* 底部信息栏：温度、运行时间、USB */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            pt={1}
            borderTop={1}
            borderColor="divider"
          >
            <Box display="flex" alignItems="center" gap={0.5}>
              <Thermostat fontSize="small" color="action" sx={{ fontSize: 16 }} />
              {mainTemp !== null ? (
                <Chip
                  label={`${mainTemp.toFixed(0)}°C`}
                  size="small"
                  color={getTempColor(mainTemp)}
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              ) : (
                <Typography variant="caption">-</Typography>
              )}
            </Box>

            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
              {systemStats?.uptime?.uptime_formatted || '-'}
            </Typography>

            <Box display="flex" alignItems="center" gap={0.5}>
              <Usb fontSize="small" color="action" sx={{ fontSize: 16 }} />
              <Chip
                label={systemStats?.usb_mode?.current_mode_name || 'N/A'}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.6rem' }}
              />
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}
