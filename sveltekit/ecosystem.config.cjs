// PM2 process config for FortuneEssence on Strato VPS
// Start:   pm2 start ecosystem.config.cjs
// Reload:  pm2 reload fortune-essence
// Logs:    pm2 logs fortune-essence
// Save:    pm2 save   (persist across reboots)
// Startup: pm2 startup  (then run the printed command as root)

module.exports = {
  apps: [
    {
      name: 'fortune-essence',
      script: './build/index.js',
      cwd: '/var/app/fortune-essence',

      // Cluster mode — one worker per CPU core for max throughput.
      // Switch to 'fork' if you see issues with session/store sharing.
      instances: 'max',
      exec_mode: 'cluster',

      // Always restart on crash
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',

      // Environment — adapter-node reads PORT and ORIGIN from env
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Log rotation (requires pm2-logrotate module)
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/fortune-essence/error.log',
      out_file: '/var/log/fortune-essence/out.log',
      merge_logs: true,

      // Graceful reload — wait for in-flight requests before killing old process
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
