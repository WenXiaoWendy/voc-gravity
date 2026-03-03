查看今日 API token 用量与费用统计。

调用 `GET /api/token-stats`，将返回的 JSON 格式化输出为易读的摘要，包含：

1. **今日费用**：总费用（元），输入/输出 token 分别计算
2. **今日调用次数**：按任务类型分类（词汇检索、语义分析、单词验证、词汇生成）
3. **token 明细**：
   - 输入 token（缓存命中 vs 未命中）
   - 输出 token
   - 使用的模型
4. **累计费用**：历史总计

如果后端未运行，提示用户先启动服务：
```
source venv/bin/activate && cd frontend && npm run api
```

计费规则参考：
- 输入（缓存命中）：0.2元/百万 tokens
- 输入（缓存未命中）：2.0元/百万 tokens
- 输出：3.0元/百万 tokens
