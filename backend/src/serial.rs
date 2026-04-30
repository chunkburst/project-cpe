/*
 * @Author: 1orz cloudorzi@gmail.com
 * @Date: 2025-12-07 07:33:11
 * @LastEditors: 1orz cloudorzi@gmail.com
 * @LastEditTime: 2025-12-13 12:46:14
 * @FilePath: /udx710-backend/backend/src/serial.rs
 * @Description: 
 * 
 * Copyright (c) 2025 by 1orz, All Rights Reserved. 
 */
//! DBus/AT Command Serialization Module
//!
//! This module provides a global lock to serialize all DBus and AT command operations
//! to prevent "org.ofono.Error.InProgress: Operation already in progress" errors.

use std::future::Future;
use tokio::sync::Mutex;
use tokio::time::{timeout, Duration};

/// Global mutex to serialize DBus/AT operations
static DBUS_LOCK: Mutex<()> = Mutex::const_new(());

/// 默认 AT 指令超时时间
const DEFAULT_TIMEOUT: Duration = Duration::from_secs(30);

/// Execute a future while holding the global DBus lock
///
/// This ensures that only one DBus/AT operation can be in progress at a time,
/// preventing "Operation already in progress" errors from ofono.
pub async fn with_serial<T, F>(f: F) -> zbus::Result<T>
where
    F: Future<Output = zbus::Result<T>>,
{
    // 获取锁，带有超时（15秒，足够大多数操作完成）
    let _guard = match timeout(Duration::from_secs(15), DBUS_LOCK.lock()).await {
        Ok(g) => g,
        Err(_) => return Err(zbus::Error::Failure("Failed to acquire DBUS_LOCK: timeout after 15s - another operation may be in progress".to_string())),
    };

    // 执行业务逻辑，带有整体超时
    match timeout(DEFAULT_TIMEOUT, f).await {
        Ok(result) => result,
        Err(_) => Err(zbus::Error::Failure("DBus operation timed out".to_string())),
    }
}

