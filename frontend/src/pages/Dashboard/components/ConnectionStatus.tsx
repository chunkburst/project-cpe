import { Box, Card, CardContent, Typography, Stack, LinearProgress } from '@mui/material'
import { Wifi, WifiOff } from '@mui/icons-material'
import type { QosInfo } from '@/api/types'
import type { ConnectivityResult } from '../hooks/useDashboardData'

interface ConnectionStatusProps {
  qosInfo: QosInfo | null
  connectivity: ConnectivityResult | null
}

export function ConnectionStatus({ qosInfo, connectivity }: ConnectionStatusProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          连接状态
        </Typography>
        <Stack spacing={1.5}>
          {/* QCI */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">QCI</Typography>
            <Typography variant="body2" fontWeight={600}>{qosInfo?.qci || '-'}</Typography>
          </Box>

          {/* 下行速率 */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography variant="caption" color="text.secondary">下行</Typography>
              <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                {qosInfo?.dl_speed ? `${(qosInfo.dl_speed / 1000).toFixed(0)} Mbps` : '-'}
              </Typography>
            </Box>
            {qosInfo?.dl_speed ? (
              <LinearProgress
                variant="determinate"
                value={Math.min((qosInfo.dl_speed / 1_000_000) * 100, 100)}
                color="success"
                sx={{ height: 4, borderRadius: 2 }}
              />
            ) : null}
          </Box>

          {/* 上行速率 */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography variant="caption" color="text.secondary">上行</Typography>
              <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                {qosInfo?.ul_speed ? `${(qosInfo.ul_speed / 1000).toFixed(0)} Mbps` : '-'}
              </Typography>
            </Box>
            {qosInfo?.ul_speed ? (
              <LinearProgress
                variant="determinate"
                value={Math.min((qosInfo.ul_speed / 500_000) * 100, 100)}
                color="primary"
                sx={{ height: 4, borderRadius: 2 }}
              />
            ) : null}
          </Box>

          {/* IPv4/IPv6 连通性 */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            pt={1}
            borderTop={1}
            borderColor="divider"
          >
            <Box display="flex" alignItems="center" gap={0.5}>
              {connectivity?.ipv4?.success ? (
                <Wifi fontSize="small" color="success" sx={{ fontSize: 16 }} />
              ) : (
                <WifiOff fontSize="small" color="error" sx={{ fontSize: 16 }} />
              )}
              <Typography variant="caption" color="text.secondary">IPv4</Typography>
              <Typography
                variant="caption"
                fontWeight={700}
                color={connectivity?.ipv4?.success ? 'success.main' : 'error.main'}
              >
                {connectivity?.ipv4?.success ? `${connectivity.ipv4.latency_ms?.toFixed(0)}ms` : '断开'}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              {connectivity?.ipv6?.success ? (
                <Wifi fontSize="small" color="success" sx={{ fontSize: 16 }} />
              ) : (
                <WifiOff fontSize="small" color="error" sx={{ fontSize: 16 }} />
              )}
              <Typography variant="caption" color="text.secondary">IPv6</Typography>
              <Typography
                variant="caption"
                fontWeight={700}
                color={connectivity?.ipv6?.success ? 'success.main' : 'error.main'}
              >
                {connectivity?.ipv6?.success ? `${connectivity.ipv6.latency_ms?.toFixed(0)}ms` : '断开'}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}
