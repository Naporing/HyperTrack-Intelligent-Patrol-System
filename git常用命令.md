---
date: 2025-10-15
---
## 1. 配置
- **配置用户信息**
```markdown
# Git 常用指令
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "youremail@example.com"
```

- **查看配置信息**
    ```bash
    git config --list
    ```
    

## 2. 创建和克隆仓库

- **初始化 Git 仓库**
    ```bash
    git init
    ```
    
- **克隆远程仓库**
    ```bash
    git clone <repository-url>
    ```
    

## 3. 查看状态和日志

- **查看仓库状态**
    ```bash
    git status
    ```
    
- **查看提交历史**
    ```bash
    git log
    ```
    
- **查看简化日志**
    ```bash
    git log --oneline
    ```

## 4. 基本操作

- **添加文件到暂存区**
    ```bash
    git add <file>
    ```
    
- **提交更改**
    ```bash
    git commit -m "Commit message"
    ```
    
- **提交所有更改**
    ```bash
    git commit -a -m "Commit message"
    ```
    
- **查看当前分支**
    ```bash
    git branch
    ```
    
- **切换分支**
    ```bash
    git checkout <branch-name>
    ```
    
- **创建新分支并切换**
    ```bash
    git checkout -b <new-branch-name>
    ```
    
- **合并分支**
    ```bash
    git merge <branch-name>
    ```
    
- **删除分支**
    ```bash
    git branch -d <branch-name>
    ```
    

## 5. 远程仓库操作

- **查看远程仓库信息**
    ```bash
    git remote -v
    ```
    
- **添加远程仓库**
    ```bash
    git remote add origin <repository-url>
    ```
    
- **推送代码到远程仓库**
    ```bash
    git push origin <branch-name>
    ```
    
- **拉取远程仓库更新**
    ```bash
    git pull origin <branch-name>
    ```
    
- **从远程仓库获取更新并合并**
    ```bash
    git fetch origin
    git merge origin/<branch-name>
    ```
    

## 6. 查看和恢复

- **查看文件修改**
    ```bash
    git diff
    ```
    
- **恢复文件到上次提交的状态**
    ```bash
    git checkout -- <file>
    ```
    
- **恢复到指定的提交版本**
    ```bash
    git reset --hard <commit-hash>
    ```
    

## 7. 标签操作

- **创建标签**
    ```bash
    git tag <tag-name>
    ```
    
- **推送标签到远程**
    ```bash
    git push origin <tag-name>
    ```
    
- **查看所有标签**
    ```bash
    git tag
    ```
    

## 8. 分支管理

- **查看所有远程分支**
    ```bash
    git branch -r
    ```
    
- **删除远程分支**
    ```bash
    git push origin --delete <branch-name>
    ```
    

## 9. 合并冲突解决

- **标记文件为已解决**
    ```bash
    git add <file>
    ```
    
- **继续合并过程**
    ```bash
    git merge --continue
    ```
    

## 10. 其他常用命令

- **查看文件状态**
    ```bash
    git ls-files
    ```
    
- **清理 Git 仓库中的未跟踪文件**
    ```bash
    git clean -fd
    ```
    
- **获取当前 Git 配置信息**
    ```bash
    git config --list
    ```
    
- **查看当前仓库的 Git 配置**
    ```bash
    git config --global --list
    ```
    

## 11. 版本回退

- **撤销最近的 commit，但保留修改**
    ```bash
    git reset --soft HEAD^
    ```
    
- **撤销最近的 commit，并丢弃修改**
    ```bash
    git reset --hard HEAD^
    ```
    

## 12. 其他操作

- **查看某个文件的修改历史**
    ```bash
    git log <file>
    ```
    
- **查看某个文件在某个 commit 时的内容**
    ```bash
    git show <commit-hash>:<file-path>
    ```
    
- **创建一个空的 Git 仓库并初始化**
    ```bash
    git init --bare <repository-name>.git
    ```
    

## 13. Git Stash（暂存）

- **保存当前修改**
    ```bash
    git stash
    ```
    
- **查看暂存的修改**
    ```bash
    git stash list
    ```
    
- **恢复暂存的修改**
    ```bash
    git stash apply
    ```
    
- **丢弃暂存的修改**
    ```bash
    git stash drop
    ```
    
- **恢复并删除暂存的修改**
    ```bash
    git stash pop
    ```
    

---

> 以上是 Git 常用指令的基本总结，可以根据需求进行修改和扩展。
