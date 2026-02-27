#!/bin/bash

echo "🚀 启动 VOC Gravity AI问答系统..."

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境并安装后端依赖
echo "📦 安装后端依赖..."
source venv/bin/activate
pip install -r backend/requirements.txt

# 安装前端依赖（包含concurrently）
echo "📦 安装前端依赖..."
cd frontend && npm install && cd ..

echo "🎯 启动应用..."
echo "前端应用: http://localhost:3000"
echo "后端API: http://localhost:8000"
echo ""

# 同时启动前后端
cd frontend && npm run start:dev
