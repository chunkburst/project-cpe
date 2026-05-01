import { Box, Card, CardContent, Typography, Stack, Switch, Chip } from '@mui/material'
import { NetworkCheck, FlightTakeoff, TravelExplore } from '@mui/icons-material'
import type { AirplaneModeResponse, RoamingResponse } from '@/api/types'

interface QuickControlsProps {
  dataStatus: boolean
  airplaneMode: AirplaneModeResponse | null
  roaming: RoamingResponse | null
  onToggleData: () => void
  onToggleAirplaneMode: () => void
  onToggleRoaming: () => void
}

export function QuickControls({
  dataStatus,
  airplaneMode,
  roaming,
  onToggleData,
  onToggleAirplaneMode,
  onToggleRoaming,
}: QuickControlsProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          快捷控制
        </Typography>
        <Stack spacing={1.5}>
          {/* 数据连接 */}
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: dataStatus ? 'success.main' : 'action.disabledBackground',
                  color: dataStatus ? '#fff' : 'text.disabled',
                }}
              >
                <NetworkCheck fontSize="small" />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={600}>数据连接</Typography>
                <Typography variant="caption" color={dataStatus ? 'success.main' : 'text.disabled'}>
                  {dataStatus ? '已开启' : '已关闭'}
                </Typography>
              </Box>
            </Box>
            <Switch checked={dataStatus} onChange={onToggleData} color="success" />
          </Box>

          {/* 漫游数据 */}
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: roaming?.roaming_allowed ? 'info.main' : 'action.disabledBackground',
                  color: roaming?.roaming_allowed ? '#fff' : 'text.disabled',
                }}
              >
                <TravelExplore fontSize="small" />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={600}>漫游数据</Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography variant="caption" color={roaming?.roaming_allowed ? 'info.main' : 'text.disabled'}>
                    {roaming?.roaming_allowed ? '已开启' : '已关闭'}
                  </Typography>
                  {roaming?.is_roaming && (
                    <Chip label="漫游中" size="small" color="warning" sx={{ height: 16, fontSize: '0.6rem' }} />
                  )}
                </Box>
              </Box>
            </Box>
            <Switch
              checked={roaming?.roaming_allowed || false}
              onChange={onToggleRoaming}
              color="info"
            />
          </Box>

          {/* 飞行模式 */}
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: airplaneMode?.enabled ? 'warning.main' : 'action.disabledBackground',
                  color: airplaneMode?.enabled ? '#fff' : 'text.disabled',
                }}
              >
                <FlightTakeoff fontSize="small" />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={600}>飞行模式</Typography>
                <Typography variant="caption" color={airplaneMode?.enabled ? 'warning.main' : 'text.disabled'}>
                  {airplaneMode?.enabled ? '已开启' : '已关闭'}
                </Typography>
              </Box>
            </Box>
            <Switch
              checked={airplaneMode?.enabled || false}
              onChange={onToggleAirplaneMode}
              color="warning"
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}
