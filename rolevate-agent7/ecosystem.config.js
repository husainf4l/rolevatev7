module.exports = {
  apps: [
    {
      name: 'rolevate-agent',
      script: '/home/husain/rolevate/rolevate-agent7/venv/bin/python',
      args: '-m uvicorn main:app --host 0.0.0.0 --port 8005 --reload',
      cwd: '/home/husain/rolevate/rolevate-agent7',
      interpreter: 'none',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        PYTHONPATH: '/home/husain/rolevate/rolevate-agent7'
      },
      env_production: {
        PYTHONPATH: '/home/husain/rolevate/rolevate-agent7'
      },
      log_file: '/home/husain/rolevate/rolevate-agent7/logs/combined.log',
      out_file: '/home/husain/rolevate/rolevate-agent7/logs/out.log',
      error_file: '/home/husain/rolevate/rolevate-agent7/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    }
  ]
};