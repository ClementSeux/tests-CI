module.exports = {
   apps: [
        {
            name: "financial-microservice",
            script: "./index.js",
            instances: "max",
            exec_mode: "cluster",
            env: {
                NODE_ENV: "production",
                PORT: 3000,
            },
            env_production: {
                NODE_ENV: "production",
                PORT: 3000,
            },
            log_date_format: "YYYY-MM-DD HH:mm:ss Z",
            error_file: "/var/log/pm2/financial-microservice-error.log",
            out_file: "/var/log/pm2/financial-microservice-out.log",
            log_file: "/var/log/pm2/financial-microservice-combined.log",
            time: true,
            watch: false,
            max_memory_restart: "1G",
            node_args: "--max-old-space-size=1024",
            restart_delay: 4000,
            max_restarts: 10,
            min_uptime: "10s",
        },
    ],
};
