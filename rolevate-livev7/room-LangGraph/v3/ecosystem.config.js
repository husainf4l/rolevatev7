module.exports = {
  apps: [{
    name: 'rolevate-agent',
    script: 'uv',
    args: 'run python agent.py dev',
    cwd: '/Users/husain/Desktop/rolevate/rolevate-livev7/room-LangGraph/v3',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/agent-error.log',
    out_file: './logs/agent-out.log',
    log_file: './logs/agent-combined.log',
    time: true
  }]
};