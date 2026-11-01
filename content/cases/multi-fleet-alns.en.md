+++
title = "Fleet Rotation II: Multiple Types & ALNS"
date = "2025-06-02T10:35:47.659000+00:00"
lastmod = "2026-05-09T05:49:34.960000+00:00"
source_id = "206891a4-bd54-8033-87c8-eb0d841bbe3a"
source_url = "https://glowing-stetson-562.notion.site/206891a4bd54803387c8eb0d841bbe3a"
description = "Extending single-type rotation to heterogeneous fleets and task combinations with adaptive large neighborhood search."
summary = "Extending single-type rotation to heterogeneous fleets and task combinations with adaptive large neighborhood search."
eyebrow = "Fleet rotation"
visual = "routing"
tags = ["ALNS", "Heterogeneous fleets", "Combinatorial optimization"]
weight = 100
portfolio = false
series_parent = "/projects/vehicle-scheduling/"
series_title = "Fleet Rotation & Maintenance Scheduling"
+++

## Project background

Large campuses and logistics operations often use several vehicle types with different travel, service, and maintenance characteristics. They must maintain hourly coverage while respecting availability, working-time, and safety rules.

This project extends the [single-type fleet rotation model](/cases/single-fleet/) to **heterogeneous fleets**, combining the staggered-maintenance subroutine with **adaptive large neighborhood search (ALNS)** to search vehicle-type allocations.

## Problem definition

For each vehicle type, a trip consists of loading, outbound travel, on-site service, return travel, and unloading. Vehicles require maintenance after their accumulated operating time reaches a threshold.

The objective is to use as few vehicles as possible while providing the required number of vehicles on site at every hour of the planning horizon.

## Parameters

| Parameter | Meaning |
| --- | --- |
| A | Number of vehicle types |
| Bᵢ | Available vehicles of type i |
| nᵢ | Loading time |
| rᵢ | Outbound travel time |
| sᵢ | On-site service time |
| r′ᵢ | Return travel time |
| mᵢ | Unloading time |
| Uᵢ | Accumulated operating-time threshold before maintenance |
| Dᵢ | Maintenance duration |
| T | Planning horizon in hours |
| P | Vehicles required on site simultaneously |

The operating-time threshold depends on accumulated outbound travel, service, and return travel across completed trips.

## Staggered-rotation subroutine

For one vehicle type and an assigned simultaneous-service requirement, the diamond algorithm constructs a rotation and calculates the required fleet size. Offsetting the initial work allowances spreads maintenance periods and supports continuous coverage.

The main framework calls this logic through methods such as `car_type.get_car_num4specified_serve(...)`.

## ALNS framework

A solution records the number of simultaneous service positions assigned to each vehicle type, for example `{'type_A': 1, 'type_B': 2}`. The subroutine evaluates the fleet needed for each assignment.

The search includes:

- **Initialization:** randomly assign service requirements while respecting type availability.
- **Destroy operators:** clear a type's assignment or remove part of its allocated service.
- **Repair operators:** fill uncovered service positions sequentially or randomly.
- **Adaptive selection:** update operator weights from their success and select operators using roulette-wheel sampling.

Simulated annealing governs acceptance, with an initial temperature of **100**, a final temperature of **10**, and exponential cooling. The search keeps the best allocation, vehicle counts, and schedules found.

## Visualization

![Gantt chart for multiple vehicle types](/media/207891a4-6ddb2010cf.png)

## Applications

The framework supports logistics and operational-service settings with multiple vehicle types, maintenance requirements, and hourly coverage targets. Its modular evaluation step can also be reused with other metaheuristics, including genetic and ant-colony methods.

## Try the application

[Open the multiple-fleet rotation demo](https://huggingface.co/spaces/zhiyingchen/multiple-rostering-app)
