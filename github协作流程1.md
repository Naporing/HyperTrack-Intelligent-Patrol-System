# 智能高铁巡检系统 GitHub 协作流程指南（新手版）

这是一份专为**首次参与团队开发的新手**准备的保姆级 GitHub 协作手册。请仔细阅读并按步骤操作，它会帮你避开90%的常见坑！

---

## 📋 前期准备：第1天必做事项

### 1. 仓库创建与权限配置（由开发者C负责）

**步骤：**
1. **创建仓库**：在 GitHub 新建仓库，命名为 `intelligent-rail-inspection`
2. **设置分支保护规则**（重要！）：
   - 进入 Settings → Branches → Add rule
   - **分支名称**：`main`
   - 勾选以下选项：
     - ✅ **Require a pull request before merging**（禁止直接推送）
     - ✅ **Require approvals**（至少1人审查）
     - ✅ **Do not allow bypassing the above settings**（禁止强制推送）
3. **邀请成员**：在 Settings → Manage access 中邀请 A、B、D 三位协作者

**C的特殊职责**：完成后在群公告贴出仓库地址，并截图展示分支保护设置

---

### 2. 本地环境初始化（每个人都要做）

**通用步骤：**
```bash
# 克隆仓库（把 YOURNAME 换成你的GitHub用户名）
git clone https://github.com/YOURNAME/intelligent-rail-inspection.git
cd intelligent-rail-inspection

# 创建个人开发分支（不要直接在main上开发！）
git checkout -b feature/YOUR_NAME/initial-setup

# 创建项目结构
mkdir -p backend frontend docs

# 第1次提交（空项目结构）
git add .
git commit -m "feat: 初始化项目结构 - [#synced]"
git push origin feature/YOUR_NAME/initial-setup
```

**关键细节**：
- **分支命名**：必须严格使用 `feature/{姓名}/{功能}` 格式（如 `feature/a/upload-api`）
- **提交信息**：末尾必须加 `[#synced]` 标记，表示已同步（这是C每日检查的重点！）
- **首次推送**：使用 `git push origin 分支名`，之后可用 `git push`

---

## 🔄 日常开发流程（第2-7天）

### 早晨：同步最新代码（每天开始工作前必做）

```bash
# 确保在 main 分支
git checkout main

# 拉取最新代码（用 --rebase 保持历史整洁）
git pull --rebase origin main

# 回到你的功能分支
git checkout feature/YOUR_NAME/current-feature

# 合并最新的 main 分支（避免后期冲突）
git merge main
# 如果有冲突，立即解决（见下文冲突处理指南）
```

### 开发中：小步提交，频繁推送

**最佳实践：**
```bash
# 完成一个小功能后立即提交（例如：完成了上传接口的校验逻辑）
git add backend/main.py
git commit -m "feat(upload): 添加文件大小校验 - [#synced]"

# 赶紧推送到远程（防止本地丢失）
git push origin feature/YOUR_NAME/upload-api

# 继续下一个功能...
```

**C的审查重点**：每天17:00检查各分支的 `[#synced]` 标记，未标记的提交会要求整改

---

### 联调前：创建 Pull Request（每日19:00前）

**步骤：**
1. **推送最终代码**：
```bash
git push origin feature/YOUR_NAME/upload-api
```

2. **在 GitHub 创建 PR**：
   - 访问仓库 → Pull requests → New pull request
   - **base 分支**：`main`
   - **compare 分支**：你的功能分支
   - **标题格式**：`[模块名] 功能描述 - 作者`（例如：`[Upload] 实现视频上传接口 - A`）
   - **描述模板**：
```markdown
## 实现内容
- [x] /upload 接口实现
- [x] 文件大小校验（100MB限制）
- [x] 统一错误格式返回

## 联调依赖
- 需要B提供视频元信息提取函数
- 需要D的前端上传页面配合测试

## 测试结果
- 本地测试通过，Postman返回正确
- 错误码：`UPLOAD_INVALID_FILE` 已加入P0集合

## 检查清单
- [x] 代码注释含 [#synced] 标记
- [x] 接口文档已更新到 docs/api.md
- [x] 未引入新依赖（或有说明）
```

3. **请求审查**：在右侧 Reviewers 栏选择至少1人（通常是C，或相关模块的协作者）

---

### 联调时：合并与冲突处理（19:00-20:00）

**由C主导的流程：**

1. **审查PR**：C检查以下几点：
   - ✅ 代码是否包含 `[#synced]` 标记
   - ✅ 接口文档是否同步更新
   - ✅ 错误码是否在P0最小集合内
   - ✅ 是否通过基础功能测试

2. **批准合并**：审查通过后点击 "Approve"，然后 "Squash and merge"（压缩合并，保持main分支整洁）

3. **解决冲突**（如果出现）：
```bash
# 在本地 main 分支拉取最新代码
git checkout main
git pull origin main

# 回到你的功能分支
git checkout feature/YOUR_NAME/upload-api

# 合并 main 并解决冲突
git merge main
# 手动编辑冲突文件，保留正确代码

# 标记冲突已解决
git add .
git commit -m "fix: 解决合并冲突 - [#synced]"

# 重新推送
git push origin feature/YOUR_NAME/upload-api
```

**新手注意**：冲突不可怕，关键是要**逐行检查**，不确定就问C！

---

## 🛡️ 代码审查规范（C的每日任务）

### C的审查Checklist：
- [ ] **功能性**：代码是否实现了需求文档中的功能？
- [ ] **同步标记**：每个commit是否包含 `[#synced]`？
- [ ] **接口契约**：返回格式是否符合 `{"success": true, "data": {}}`？
- [ ] **错误处理**：是否使用了P0最小错误码集合？
- [ ] **文档更新**：`docs/api.md` 是否同步？
- [ ] **代码风格**：是否遵循团队约定（如函数命名、注释规范）？

### 审查意见示例：
> @A `/upload`接口的视频存储路径写死了，请改用配置变量 - [未同步]
> @B 请在 `run_detection` 函数注释中添加 `# SYNCED` 标记 - [阻塞合并]
> @D Canvas的resize逻辑有bug，全屏时坐标偏移，参考 `docs/ui-decisions.md` 第3条 - [需修复]

---

## 📌 特殊约定（本项目专属）

### 1. **接口快照机制（由A执行）**
每天17:00，A必须在群里发送当日接口快照：
```
【接口快照 2025-11-XX】
/upload: ✅ stable（commit: a3b5c2d）
/detect/{task_id}: ⚠️ 修改中（预计明天完成）
...
```
C会核对快照与实际代码，发现不一致立即叫停

### 2. **Mock数据规范（由D提供）**
当B的推理未完成时，D必须提供符合规范的Mock数据：
```json
// 文件位置：frontend/src/mocks/sample_detections.json
// 必须包含：frame_index, time, boxes (id, xyxy, label)
```
格式错误会导致C在审查时打回

### 3. **风险看板更新（由C维护）**
每天碰头会后，C立即更新 `docs/risk-board.md`：
```markdown
## 风险看板（2025-11-XX）

### 高风险
- [ ] Canvas全屏错位（负责人：D，应对方案：第4天重点测试）

### 已关闭
- [x] YOLO推理速度慢（关闭原因：已降低测试视频分辨率）
```
所有成员每天必须查看此文件

---

## 🚀 版本发布流程（第7天21:00）

### 1. 打 Tag 标记版本
```bash
# 确保所有代码已合并到main
git checkout main
git pull origin main

# 创建tag（由C执行）
git tag -a mvp-p0 -m "MVP P0版本：基础检测与演示功能"

# 推送到GitHub
git push origin mvp-p0
```

### 2. 创建 GitHub Release
1. 访问仓库 → Releases → Create a new release
2. **Tag**：选择 `mvp-p0`
3. **Release标题**：`智能高铁巡检系统 MVP-P0 发布`
4. **描述内容**（由C整理）：
```markdown
## 功能清单
✅ 视频上传与存储
✅ YOLOv8 3类电杆检测
✅ video.js + Canvas 框同步播放
✅ 历史任务跳转查看
✅ 演示版标注入口

## 技术栈
- 后端：FastAPI + SQLite + ultralytics
- 前端：React + Vite + video.js
- 模型：YOLOv8 (best.onnx)

## 已知问题
- 标注功能为演示，未真实保存
- Canvas全屏偶尔偏移（P1优化）

## 文档入口
- [接口文档](docs/api.md)
- [用户手册](docs/user_manual.md)
```

---

## 🆘 常见问题快速解决

### Q1: 推送被拒绝（rejected）？
```bash
# 错误提示：! [rejected] main -> main (non-fast-forward)
# 解决：不要推送main，只推送你的功能分支
git push origin feature/YOUR_NAME/xxxx
```

### Q2: 忘记打 `[#synced]` 标记？
```bash
# 修改最后一次提交信息
git commit --amend -m "feat: xxx - [#synced]"

# 如果已推送，需要强制推送（仅自己的功能分支！）
git push --force origin feature/YOUR_NAME/xxxx
```

### Q3: 误操作合并了错误的分支？
```bash
# 立即告诉C，然后执行
git reset --hard HEAD~1  # 回退1次提交
git push --force origin feature/YOUR_NAME/xxxx
```

### Q4: 找不到接口文档？
- 必须查看 `docs/api.md`（由A维护）
- 不确定时在群里@A，并@C确认

---

## 🎓 新手生存法则

1. **早推送，勤推送**：每小时推送一次，避免最后冲突爆炸
2. **小功能，小提交**：一个commit只做一件事，方便回退
3. **多沟通，少猜测**：不确定就问，15分钟碰头会是你的救命稻草
4. **听C的，没错**：C是项目管理，他的审查意见是最高优先级
5. **保留证据**：所有联调问题截图发群，避免背锅

---

## 📊 每日时间表示例（仅供参考）

| 时间        | 任务                    |
| ----------- | ----------------------- |
| 18:30-19:00 | 同步代码，处理审查意见  |
| 19:00-19:15 | 碰头会（C组织）         |
| 19:15-20:00 | 联调测试                |
| 20:00-20:30 | 创建PR，更新文档        |
| 20:30-21:00 | C合并代码，更新风险看板 |

---

**最后的话**：这份流程是保护盾，不是枷锁。严格遵守它，你就能在7天内顺利交付，还能学到真正的团队协作精髓。加油！