module.exports = {
  apps: [{
    name: 'livekit-voice-agent',
    script: '/home/husain/rolevate/rolevate-livev7/room-LangGraph/v3/.venv/bin/python3',
    args: 'agent.py dev',
    cwd: '/home/husain/rolevate/rolevate-livev7/room-LangGraph/v3',
    interpreter: 'none',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 5000,
    env: {
      NODE_ENV: 'development',
      PYTHONPATH: '/home/husain/rolevate/rolevate-livev7/room-LangGraph/v3',
      VIRTUAL_ENV: '/home/husain/rolevate/rolevate-livev7/room-LangGraph/v3/.venv',
      PATH: '/home/husain/rolevate/rolevate-livev7/room-LangGraph/v3/.venv/bin:/usr/local/bin:/usr/bin:/bin',
      // LiveKit Memory Configuration
      LIVEKIT_MEMORY_WARN_MB: '2048',
      LIVEKIT_MEMORY_LIMIT_MB: '0',
      // GPU Optimization
      CUDA_VISIBLE_DEVICES: '0'
    },
    env_production: {
      NODE_ENV: 'production',
      PYTHONPATH: '/home/husain/rolevate/rolevate-livev7/room-LangGraph/v3',
      VIRTUAL_ENV: '/home/husain/rolevate/rolevate-livev7/room-LangGraph/v3/.venv',
      PATH: '/home/husain/rolevate/rolevate-livev7/room-LangGraph/v3/.venv/bin:/usr/local/bin:/usr/bin:/bin',
      // LiveKit Memory Configuration  
      LIVEKIT_MEMORY_WARN_MB: '2048',
      LIVEKIT_MEMORY_LIMIT_MB: '0',
      // GPU Optimization
      CUDA_VISIBLE_DEVICES: '0',
      PYTORCH_CUDA_ALLOC_CONF: 'max_split_size_mb:128'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/agent-error.log',
    out_file: './logs/agent-out.log',
    log_file: './logs/agent-combined.log',
    time: true,
    merge_logs: true,
    // Graceful shutdown
    kill_timeout: 30000,
    listen_timeout: 10000,
    // Health check
    health_check_grace_period: 3000
  }]
};