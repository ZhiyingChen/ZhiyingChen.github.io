+++
title = "Reproducing Reinforcement Learning Algorithms"
date = "2026-05-09T03:46:03.613000+00:00"
lastmod = "2026-05-09T03:49:59.845000+00:00"
source_id = "35b891a4-bd54-80e0-bd6f-eed6faa47e89"
source_url = "https://glowing-stetson-562.notion.site/35b891a4bd5480e0bd6feed6faa47e89"
description = "Implementations of classic reinforcement learning algorithms, with runnable examples, environment tools, and experiment notes."
summary = "Implementations of classic reinforcement learning algorithms, with runnable examples, environment tools, and experiment notes."
eyebrow = "Learning & research"
visual = "learning"
tags = ["Reinforcement learning", "Algorithm reproduction", "Python"]
weight = 70
portfolio = true
+++

> Implementations accompanying Zhao Shiyu's reinforcement learning course, using GridWorld to connect algorithm theory, controlled experiments, logging, and reusable software design.

![Reinforcement learning experiments and visualizations](/media/35b891a4-203a93054c.png)

## Motivation

While studying reinforcement learning, I wanted a framework that would let me compare algorithm behavior, inspect convergence, and reuse the same environment across experiments.

I designed the environment, algorithm modules, and logging system as an extensible project, with a focus on understanding why a policy behaves as it does.

## A reusable experiment framework

The custom **GridWorld** environment separates states, actions, and transition logic into modules. Algorithms are independent of the environment, making it easier to extend the project and run comparable experiments.

This work connects system modeling with software abstraction: the same environment provides a consistent basis for testing different methods.

## Implemented algorithms

The current implementation covers material from **Chapters 4–8**:

- Value iteration.
- Policy iteration and truncated policy iteration.
- Monte Carlo: basic, exploring starts, and ε-greedy variants.
- Robbins–Monro stochastic approximation.
- Gradient descent variants: BGD, MBGD, and SGD.
- Temporal-difference learning.
- Value function approximation.

Experiments distinguish on-policy and off-policy methods and track convergence over time, alongside the final result.

## Logging and visualization

- Python `logging` provides consistent experiment records.
- TensorBoard tracks returns, ε decay, and Q-value convergence.
- Execution-time measurements help compare computational performance.

Together, these tools make experiments easier to inspect and reproduce.

## Project structure

```text
reinforcement_learning/
├── main/          # Experiment entry points
├── algorithms/    # Algorithm implementations
├── utils/         # Environments, logging, and visualization
└── logs/          # TensorBoard and execution records
```

## What I am building through this work

- Translating reinforcement learning principles into reusable implementations.
- Understanding when different algorithms are appropriate.
- Designing experiments that reveal algorithm behavior.
- Building a foundation for more complex reinforcement learning systems.

## Code and next steps

[View the reinforcement learning project on GitHub](https://github.com/ZhiyingChen/reinforcement_learning)

I plan to add policy gradient methods and explore more complex decision-making scenarios as I continue studying.
