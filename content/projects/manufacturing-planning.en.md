+++
title = "Master Production Planning & Manufacturing Coordination"
date = "2026-05-09T06:04:39.426000+00:00"
lastmod = "2026-05-09T06:10:00.989000+00:00"
source_id = "35b891a4-bd54-8029-9bc4-cfdbe5549dcd"
source_url = "https://glowing-stetson-562.notion.site/35b891a4bd5480299bc4cfdbe5549dcd"
description = "Unifying demand, capacity, inventory, procurement, process constraints, and delivery goals in executable production plans."
summary = "Unifying demand, capacity, inventory, procurement, process constraints, and delivery goals in executable production plans."
eyebrow = "Production planning"
visual = "planning"
tags = ["MPS", "Manufacturing coordination", "Mixed-integer programming"]
weight = 10
portfolio = true
+++

- [Intelligent Scheduling for Battery Manufacturing](/cases/battery-scheduling/)
- [Master Production Planning for Photovoltaics](/cases/solar-mps/)
- [Master Planning for Appliance Manufacturing](/cases/appliance-mps/)

## Overview

This series explores **master production planning**, a central and often difficult-to-control layer of manufacturing operations.

My focus is on bringing demand, capacity, inventory, procurement, process constraints, and delivery targets into one optimization framework that produces executable production plans.

The three projects address different industries and levels of complexity, following a common path: **start with a general master planning framework, extend it to coupled manufacturing processes, and then address complex scheduling with frequent changeovers, variability, and tightly connected constraints.**

## What problems does this series address?

Master planning is a cross-functional, multi-period systems problem. Common difficulties include:

- Fluctuating demand and delivery pressure that lead to frequent plan changes.
- Dependencies among purchasing, production, inventory, and transport, where local improvements can destabilize the overall plan.
- Significant differences in equipment, processes, and organization across industries.
- Equipment start/stop rules, changeover losses, ramp-up capacity, and process coordination that make optimization harder.
- A need for plans that business users can explain, execute, and review.

The goal is to develop **a planning system with a reusable core that can adapt to industry-specific requirements**.

## The research path

### 1. A general master planning framework

Coordinate procurement, production, inventory, and transportation in an extensible MPS model.

### 2. Industry-specific manufacturing coordination

Apply the framework to photovoltaics, accounting for crystal growth and wafer slicing, equipment states, coupled capacity, and long-term planning.

### 3. Complex manufacturing scheduling

Extend the approach to mixed-model battery production, integrating changeover losses, ramp-up discounts, and delivery timing.

Together, these form a continuous progression: **general framework → industry-specific coordination → complex scheduling**.

## Projects in the series

### Appliance manufacturing: the planning foundation

This project establishes a reusable master planning model for:

- Demand expansion.
- BOM explosion.
- Identification of effective inventory points.
- Procurement and production planning.
- Inventory balance.
- Coordination with transportation constraints.

A **main model plus a supply-relationship model** separates supply–demand balance from detailed sourcing relationships. This keeps the overall plan feasible while supporting further business detail.

The model serves as an extensible MPS engine for discrete manufacturing and multi-level supply chains. It treats planning as a unified decision across procurement, production, inventory, and transportation.

Project results showed improvements in on-time delivery, backlogs, purchasing deviations, and critical-resource utilization, supporting the model’s practical usefulness and interpretability.

### Photovoltaics: planning under strong process constraints

The photovoltaic project applies MPS to **crystal growth and wafer slicing**. Its distinctive challenges include:

- Coupled capacity between successive processes.
- Restricted equipment start/stop decisions.
- Reduced first-day capacity for newly started equipment.
- Daily decisions across an annual horizon.
- Process parameters and capacity limits that change by month.

The model jointly considers unmet demand, smoother production, appropriate inventory buffers, and higher capacity utilization.

This moves beyond basic supply–demand balance into **equipment states, process coupling, and long-term planning**. When manufacturing processes themselves constrain the plan, MPS must coordinate the way production operates as well as quantities.

### Battery manufacturing: complex mixed-model scheduling

Battery production introduces additional challenges:

- Significant losses when switching product models.
- A ramp-up period after equipment changes.
- A production line generally processing one model per day.
- Costs from frequent equipment starts and stops.
- Conflicting objectives for shortages, changeover count, and delivery timing.

I use ideas such as **production coverage intervals** and **symmetry breaking** to improve solution performance and make results easier to execute.

The project reported better on-time delivery, fewer changeovers, shorter average delivery cycles, and higher capacity utilization. It connects the master planning layer with the realities of detailed manufacturing schedules.

## Capabilities demonstrated

- Translate business language into structured constraints involving demand, inventory, capacity, processes, and delivery.
- Build extensible planning frameworks that support more than one scenario.
- Adapt a general model to industry-specific constraints.
- Connect medium- and long-term planning with detailed scheduling.
- Balance solution quality, speed, explainability, and operational execution.

The series connects **manufacturing planning, business modeling, operations research, and system implementation**.

## Applications

- Multi-product discrete manufacturing with numerous constraints.
- Master planning across procurement, production, inventory, and delivery.
- Process manufacturing with coupled stages and equipment states.
- Complex production with costly changeovers, delivery pressure, and frequent fluctuations.
- Teams moving from Excel or experience-based planning to systematic decision support.

## Why this series matters

Master planning is a capability that evolves from a general structure into industry-specific depth. Appliance manufacturing establishes the core, photovoltaics tests process-constrained adaptation, and batteries extend it to more complex scheduling. Taken together, the projects show a connected modeling approach rather than isolated case studies.
