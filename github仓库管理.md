下面是 **可直接放入你们 GitHub 仓库的 `README.md` 版本** —— 排版正式、简洁、实用，可立即作为团队协作规范使用👇

------

# 🚀 Git 协作流程规范

## 🧩 分支模型

```
main       —— 生产稳定分支（始终保持可部署）
develop    —— 联调 / 集成分支
feature/*  —— 功能开发分支（每个功能一个）
hotfix/*   —— 紧急修复分支
```

------

## 🛠️ 开发流程（Feature 开发）

1. 从 develop 创建功能分支

   ```bash
   git checkout develop
   git pull
   git checkout -b feature/<name>
   ```

2. 编码、提交（保持 commit 小而清晰）

3. 推送到远程

   ```bash
   git push -u origin feature/<name>
   ```

4. 功能完成后发起 PR：
    **feature → develop**

------

## 🔧 联调流程（Develop 阶段）

1. 联调人员更新 develop

   ```bash
   git checkout develop
   git pull
   ```

2. 测试、补齐接口、解决冲突

3. 多个 feature 分支内容汇总在 develop

4. develop 版本稳定后，管理员创建 PR：
    **develop → main**

------

## 🚀 发布流程（Main）

1. 管理员审核 develop 无误

2. 合并到 main

3. 创建版本 Tag

   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

4. 部署上线（自动/手动）

------

## 📝 Commit（CL）规范

使用以下前缀保持提交清晰统一：

```
feat: 新功能
fix: 修复 Bug
refactor: 重构代码（无功能变化）
style: 格式调整（不影响逻辑）
test: 测试相关
docs: 文档更新
chore: 构建/依赖/CI 等杂项
```

示例：

```
feat: 新增视频解析接口
fix: 修复帧处理函数的空指针异常
```

------

## 🧹 .gitignore 规范（关键要点）

必须忽略以下内容：

- 大型依赖目录（node_modules / venv）
- 训练数据、模型文件、视频等大资源
- 构建产物（dist、build 等）
- 缓存、日志、临时文件
- IDE 配置（.idea / .vscode）

示例片段：

```
node_modules/
dist/
__pycache__/
*.log
data/
models/
test/videos/
```

------

## 📌 团队协作要求

- 所有开发必须基于 feature/*
- 禁止直接向 main 推送
- 进入 develop / main 必须通过 PR
- PR 必须至少 1 人 Code Review
- CI（lint + test）必须通过
- main 分支时刻保持可部署状态

