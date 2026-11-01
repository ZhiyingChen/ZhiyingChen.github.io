+++
title = "强化学习算法复现（含github链接）"
date = "2026-05-09T03:46:03.613000+00:00"
lastmod = "2026-05-09T03:49:59.845000+00:00"
source_id = "35b891a4-bd54-80e0-bd6f-eed6faa47e89"
source_url = "https://glowing-stetson-562.notion.site/35b891a4bd5480e0bd6feed6faa47e89"
description = "围绕强化学习经典算法进行代码复现，整理实验入口、算法实现、环境工具和运行记录。"
summary = "围绕强化学习经典算法进行代码复现，整理实验入口、算法实现、环境工具和运行记录。"
eyebrow = "学习与研究"
visual = "learning"
tags = ["强化学习", "算法复现", "Python"]
weight = 70
portfolio = true
+++

> 【赵世钰强化学习课程算法复现】一个面向工程实践的强化学习基础代码框架，以网格世界为例子，涵盖 DP / MC / SD 算法，实现完整实验闭环与可扩展架构设计。

![image.png](/media/35b891a4-203a93054c.png)

## 🔹 前言

> 近期在学习赵世钰老师的强化学习课程。这个项目是我对强化学习基础算法的系统性实现，目标不是“跑通算法”，而是构建一个可扩展、可对比、可复用的 RL 实验框架，用于理解算法行为、验证策略效果，并为后续复杂模型打下工程基础。

---

## 🔹 为什么要做这个项目？

> 在学习强化学习的过程中，我发现很多别的版本的复现停留在“能跑通”，但缺少工程结构、实验可控性和可复用性。
>
> 因此我选择自己设计环境、算法模块和日志系统，把强化学习当作一个“可持续演进的系统工程”来实现，而不是一次性代码实验。

---

## 🔹 项目做了什么？

### ✅ 1. 构建可复用的 RL 实验框架

- 自定义 GridWorld 环境

- 状态、动作、转移逻辑完全模块化

- 算法与环境解耦，便于扩展

👉 <strong>体现能力</strong>：系统建模 + 抽象能力

---

### ✅ 2. 系统实现 RL 核心算法（目前涵盖Chapter 4–8）

#### 已实现算法

- Value Iteration

- Policy Iteration

- Truncated Policy Iteration

- Monte Carlo (Basic / Exploring Starts / ε-Greedy)

- Robbins - Monro

- GD variants（BGD / MBGD / SGD）

- TD Learning

- Function Approximation Value

#### 特点

- 同一环境下对比不同算法行为

- 清晰区分 on-policy / off-policy

- 可观察收敛过程而非只看结果

👉 <strong>辅助提升</strong>：算法理解深度 + 实验设计能力

---

### ✅ 3. 工程级日志 &amp; 可视化系统

- Python logging 统一管理

- TensorBoard 可视化：

    - 回报变化

    - ε 衰减

    - Q-value 收敛

- 代码执行时间统计（性能感知）

👉 <strong>辅助提升</strong>：不是写算法，是做“可分析系统”

---

## 🔹 项目结构（简洁版）

````text
reinforcement_learning/
├── main/# 实验入口
├── algorithms/# DP / MC / SD 等的实现
├── utils/# 环境 / 日志 / 可视化
├── logs/# TensorBoard & 运行记录
````

---

### 💡 本项目旨在辅助提升以下能力

- ✔ 将强化学习算法抽象为可复用系统

- ✔ 能从“算法原理”过渡到“工程实现”

- ✔ 熟悉 RL 中 算法 的适用边界

- ✔ 能设计实验验证算法行为

- ✔ 具备长期扩展为复杂 RL 系统的能力

---

## 🔹 项目链接

📎 GitHub

[GitHub - ZhiyingChen/reinforcement\_learning](https://github.com/ZhiyingChen/reinforcement_learning#)

---

## 🔹 To Be Continued

> 本项目是我系统学习强化学习的起点，后续将继续扩展 Policy Gradient 等，并结合更复杂决策场景进行实验。
