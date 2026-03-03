启动 VOC Gravity 开发环境（后端 8000 + 前端 3000）。

执行以下步骤：

1. **检查 venv**：确认 `backend/venv/` 或项目根目录下的 `venv/` 是否存在。如不存在，提示用户先运行 `./start.sh`。

2. **检查端口占用**：用 `lsof -ti:8000` 和 `lsof -ti:3000` 检查端口是否已被占用。如已占用，提示用户并询问是否继续。

3. **启动后端**：在后台启动 Flask（`source venv/bin/activate && cd backend/api && python app.py`），等待 2 秒。

4. **健康检查后端**：`curl -s http://localhost:8000/api/health`。如失败，显示错误日志并停止。

5. **启动前端**：在后台启动 Vite dev server（`cd frontend && npm run dev`），等待 3 秒。

6. **健康检查前端**：`curl -s http://localhost:3000` 确认响应正常。

7. **输出结果**：显示两个服务的状态、访问地址，以及 token 用量速查命令：
   ```
   curl http://localhost:8000/api/token-stats
   ```
