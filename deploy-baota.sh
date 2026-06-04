#!/bin/bash
set -e

echo "=== 海克斯大乱斗 - 宝塔面板部署脚本 ==="
echo ""

APP_DIR="/www/wwwroot/hex-mayhem"
NODE_VERSION="20"

check_bt() {
    echo "1. 检查宝塔环境..."
    if [ ! -d "/www/server/panel" ]; then
        echo "❌ 未检测到宝塔面板，请先安装宝塔"
        exit 1
    fi
    echo "✅ 宝塔面板已安装"
}

install_node() {
    echo ""
    echo "2. 检查 Node.js..."
    if command -v node &> /dev/null; then
        NODE_VER=$(node -v)
        echo "✅ Node.js 已安装: $NODE_VER"
    else
        echo "⚠️  Node.js 未安装，请在宝塔面板 → 软件商店 → 安装 PM2管理器（会自动安装Node.js）"
        exit 1
    fi
}

setup_app() {
    echo ""
    echo "3. 部署应用..."
    
    if [ ! -d "$APP_DIR" ]; then
        mkdir -p "$APP_DIR"
    fi

    echo "   复制项目文件..."
    cp -r api/ "$APP_DIR/api/"
    cp -r public/ "$APP_DIR/public/"
    cp package.json package-lock.json "$APP_DIR/"
    cp .env.production "$APP_DIR/.env"

    cd "$APP_DIR"

    echo "   安装生产依赖..."
    npm ci --omit=dev
    npm install tsx

    echo "   构建前端..."
    if [ -d "/workspace/dist" ]; then
        cp -r /workspace/dist "$APP_DIR/dist"
    else
        echo "   ⚠️  前端未构建，请先在开发机运行 npm run build"
    fi

    mkdir -p "$APP_DIR/data" "$APP_DIR/public/uploads"
    chmod -R 755 "$APP_DIR/data" "$APP_DIR/public/uploads"

    echo "✅ 应用部署完成"
}

setup_pm2() {
    echo ""
    echo "4. 配置 PM2 进程守护..."
    
    cat > "$APP_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [{
    name: 'hex-mayhem',
    script: 'api/server.ts',
    node_args: '--import tsx',
    cwd: '/www/wwwroot/hex-mayhem',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 1,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    watch: false,
    max_memory_restart: '500M',
    error_file: '/www/wwwroot/hex-mayhem/logs/error.log',
    out_file: '/www/wwwroot/hex-mayhem/logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
}
EOF

    mkdir -p "$APP_DIR/logs"

    if command -v pm2 &> /dev/null; then
        cd "$APP_DIR"
        pm2 delete hex-mayhem 2>/dev/null || true
        pm2 start ecosystem.config.js
        pm2 save
        echo "✅ PM2 进程已启动"
    else
        echo "⚠️  PM2 未安装，请在宝塔面板 → 软件商店 → 安装 PM2管理器"
        echo "   安装后运行: cd $APP_DIR && pm2 start ecosystem.config.js"
    fi
}

show_result() {
    echo ""
    echo "=== 部署完成！ ==="
    echo ""
    echo "📋 宝塔面板配置步骤:"
    echo "   1. 宝塔面板 → 网站 → 添加站点"
    echo "      域名: 你的域名"
    echo "      根目录: $APP_DIR"
    echo ""
    echo "   2. 站点设置 → 反向代理 → 添加反向代理"
    echo "      代理名称: hex-mayhem"
    echo "      目标URL: http://127.0.0.1:3001"
    echo ""
    echo "   3. 站点设置 → SSL → Let's Encrypt"
    echo "      勾选域名 → 申请证书 → 开启强制HTTPS"
    echo ""
    echo "   4. 站点设置 → 配置文件 → 在 server 块内添加:"
    echo "      location /api/ {"
    echo "          proxy_pass http://127.0.0.1:3001;"
    echo "          proxy_set_header Host \$host;"
    echo "          proxy_set_header X-Real-IP \$remote_addr;"
    echo "          proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
    echo "          proxy_set_header X-Forwarded-Proto \$scheme;"
    echo "      }"
    echo ""
    echo "🔐 默认管理员: admin / admin123 (首次登录强制改密)"
    echo ""
    echo "📊 管理命令:"
    echo "   查看日志: pm2 logs hex-mayhem"
    echo "   重启服务: pm2 restart hex-mayhem"
    echo "   停止服务: pm2 stop hex-mayhem"
    echo "   查看状态: pm2 status"
}

check_bt
install_node
setup_app
setup_pm2
show_result
