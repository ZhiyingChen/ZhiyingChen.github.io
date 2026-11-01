+++
title = "Fleet Rotation & Maintenance Scheduling"
date = "2026-05-09T05:38:56.072000+00:00"
lastmod = "2026-05-09T05:50:44.212000+00:00"
source_id = "35b891a4-bd54-803d-9ed2-ebde61546a8e"
source_url = "https://glowing-stetson-562.notion.site/35b891a4bd54803d9ed2ebde61546a8e"
description = "Balancing continuous service, maintenance cycles, and task requirements, from single-type fleet rotation to multi-type allocation with ALNS."
summary = "Balancing continuous service, maintenance cycles, and task requirements, from single-type fleet rotation to multi-type allocation with ALNS."
eyebrow = "Scheduling"
visual = "routing"
tags = ["Fleet rotation", "ALNS", "Maintenance scheduling"]
weight = 30
portfolio = true
+++

## Overview

This series asks how to rotate limited vehicle resources while balancing continuous service, maintenance cycles, and task constraints.

Starting with a single vehicle type, I developed a **diamond algorithm** for staggering maintenance. I then extended it to heterogeneous fleets, using **Adaptive Large Neighborhood Search (ALNS)** to optimize task allocation.

- [Fleet Rotation I: Single-Type Maintenance Scheduling](/cases/single-fleet/)
- [Fleet Rotation II: Multiple Types & ALNS](/cases/multi-fleet-alns/)

## What problems does this series address?

In logistics support, campus operations, manufacturing logistics, and defense applications, vehicle scheduling involves more than assigning tasks.

![Fleet rotation and maintenance scheduling illustration](/media/35b891a4-725b86ba13.png)

The problem typically combines:

- Hourly demand for uninterrupted service.
- A limited number of vehicles.
- Maximum continuous working time per vehicle.
- Maintenance downtime after accumulated use.
- Different task capabilities across vehicle types.
- A long service horizon with no interruption allowed.

The central question is **how to maintain service while avoiding maintenance peaks, balancing rotation, and minimizing the required fleet size**.

## The research path

### 1. Single-type fleet rotation

The foundation assumes:

- One vehicle type.
- A fixed minimum number of active vehicles each hour.
- Maintenance after a specified number of operating hours.
- A long horizon, such as 30 days, covered by as few vehicles as possible.

The diamond algorithm sets initial remaining work times for vehicles as they enter the system. This staggers maintenance along the timeline and avoids service gaps caused by several vehicles entering maintenance together.

### 2. Maintenance scheduling for multiple vehicle types

In a heterogeneous fleet, types differ in:

- Available quantities.
- Task procedures.
- Maintenance cycles.
- Service loads they can cover.

The model must decide how much service each type provides, how types combine to meet total demand, and how to balance coverage, maintenance, and fleet size.

I encapsulate the single-type diamond algorithm as a submodule and apply **ALNS** to search the space of allocations across vehicle types.

## Method structure

The approach has two layers:

- **Lower layer:** the diamond algorithm handles staggered maintenance and minimum fleet size for one type.
- **Upper layer:** heuristic search finds better allocations among multiple types.
- **Outputs:** vehicle counts, rotation schedules, and Gantt chart visualizations.

This keeps single-type decisions interpretable, makes heterogeneous-fleet extensions easier, and gives each module a clear role so that components can be replaced or improved.

## Projects in the series

### Foundation: single-type rotation

- Continuous service at hourly resolution.
- Staggered maintenance cycles.
- A purpose-built diamond algorithm.
- Minimum vehicle counts and schedule Gantt charts.
- In the example scenario, five vehicles cover a 30-day service horizon.

[Read the single-type case study](/cases/single-fleet/).

### Extension: multiple vehicle types

- Multiple vehicle types with independent parameters and maintenance cycles.
- The diamond algorithm as a single-type solver.
- ALNS for searching combinations of service allocations.
- Overall allocations and corresponding schedules.

[Read the heterogeneous-fleet case study](/cases/multi-fleet-alns/).

## Capabilities demonstrated

- Translate practical rotation and maintenance rules into computable models.
- Design problem-specific algorithm mechanisms.
- Extract reusable modules from a focused problem and extend them to more complex settings.
- Connect solution logic with explanation and visualization.

## Applications

- Operations vehicles on industrial campuses.
- Defense and aerospace logistics support.
- Internal logistics in manufacturing plants.
- Inspection, emergency repair, and security rotations.
- Specialized vehicle scheduling at airports and ports.

## Why this series matters

The series develops a reusable method: identify the structure of a single-type problem, turn it into a stable algorithm module, and extend it to heterogeneous-fleet optimization.

My goal is a solution framework that can be **extended, explained, and improved over time**.
