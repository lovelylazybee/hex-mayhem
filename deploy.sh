#!/bin/bash
set -e

echo "=== 海克斯大乱斗赛事网站 - 部署脚本 ==="
echo ""

check_deps() {
    echo "1. 检查依赖..."
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker 未安装，正在安装..."
        curl -fsSL https://get.docker.com | sh
        systemctl start docker
        systemctl enable docker
        echo "✅ Docker 安装完成"
    else
        echo "✅ Docker 已安装"
    fi

    if ! command -v docker compose &> /dev/null; then
        echo "❌ Docker Compose 未安装"
        exit 1
    fi
    echo "✅ Docker Compose 已安装"
}

check_env() {
    echo ""
    echo "2. 检查环境配置..."
    if [ ! -f .env.production ]; then
        echo "❌ .env.production 不存在，从模板创建..."
        cp .env.example .env.production
        echo "⚠️  请编辑 .env.production 填入生产密钥和域名！"
        echo "   必须修改: JWT_SECRET, JWT_REFRESH_SECRET, CORS_ORIGINS"
        exit 1
    fi
    echo "✅ .env.production 已存在"
}

build_and_start() {
    echo ""
    echo "3. 构建并启动服务..."
    docker compose build --no-cache
    docker compose up -d
    echo "✅ 服务已启动"
}

show_status() {
    echo ""
    echo "4. 服务状态:"
    docker compose ps
    echo ""
    echo "=== 部署完成！ ==="
    echo ""
    echo "📋 后续步骤:"
    echo "   1. 如需SSL证书: ./init-ssl.sh 你的域名 你的邮箱"
    echo "   2. 查看日志: docker compose logs -f"
    echo "   3. 停止服务: docker compose down"
    echo "   4. 重新部署: docker compose up -d --build"
    echo ""
    echo "🔐 默认管理员: admin / admin123 (首次登录强制改密)"
}

check_deps
check_env
build_and_start
show_status
