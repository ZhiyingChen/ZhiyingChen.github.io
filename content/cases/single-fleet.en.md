+++
title = "Fleet Rotation I: Single-Type Maintenance Scheduling"
date = "2025-06-02T04:11:13.438000+00:00"
lastmod = "2026-05-09T05:49:40.217000+00:00"
source_id = "206891a4-bd54-8051-af47-d464a5fd57a9"
source_url = "https://glowing-stetson-562.notion.site/206891a4bd548051af47d464a5fd57a9"
description = "Staggering maintenance and finding the minimum fleet size required to maintain continuous service."
summary = "Staggering maintenance and finding the minimum fleet size required to maintain continuous service."
eyebrow = "Fleet rotation"
visual = "routing"
tags = ["Staggered maintenance", "Fleet rotation", "Diamond algorithm"]
weight = 100
portfolio = false
series_parent = "/projects/vehicle-scheduling/"
series_title = "Fleet Rotation & Maintenance Scheduling"
+++

## Project background

A logistics operation needs vehicles on duty around the clock. Each vehicle has work-hour limits and mandatory maintenance periods, creating a rotation problem: **how few vehicles can provide continuous coverage?**

I developed a scheduling model and a staggered-maintenance heuristic, called the **diamond algorithm**, to distribute maintenance periods more evenly.

## Problem definition

![Original fleet-rotation problem diagram in Chinese](/media/206891a4-c936a9c32e.png)

- At least one vehicle must be in service every hour.
- A single continuous duty lasts no more than six hours.
- After 100 accumulated service hours, a vehicle needs 48 hours of maintenance, including eight hours of preparation that may overlap with maintenance.
- The planning horizon is **30 consecutive days, or 720 hours**.
- The objective is to minimize fleet size and produce a vehicle-level Gantt chart.

## Parameters

| Parameter | Meaning |
| --- | --- |
| `t_pack` | Loading time |
| `t_unpack` | Unloading time |
| `t_pre` | Preparation time |
| `t_go` | Outbound travel time |
| `t_back` | Return travel time |
| `t_serve` | Duration of one service duty, in hours |
| `t_rest` | Maintenance duration, in hours |
| `t_work` | Maximum accumulated working hours before maintenance |
| `t0` / `t1` | Planning start and end times |
| `t_gap` | Staggering interval, in hours |

## Baseline: greedy scheduling

Starting at `t0`, the scheduler checks whether any vehicle is available and has enough working time left for another duty. It assigns an available vehicle or creates a new one, then updates its remaining work allowance and next available time.

```python
fleet = []
t = t0
while t < t1:
    vehicle = find_available_vehicle(fleet, t)
    if vehicle is None:
        vehicle = create_vehicle(available_at=t, remaining_work=t_work)
        fleet.append(vehicle)
    assign_duty_and_update(vehicle, t)
    t += t_serve
```

This is illustrative pseudocode. The baseline can allow several vehicles to enter maintenance together, creating a temporary fleet shortage.

## Diamond algorithm: staggered maintenance

The proposed method adjusts each newly introduced vehicle's initial remaining work allowance. Consecutive vehicles receive allowances offset by `t_gap`, spreading their future maintenance periods across the timeline.

1. Initialize the first vehicle with zero remaining working hours and send it directly to maintenance.
2. When another vehicle is needed, offset its initial allowance from the previous vehicle's allowance by `t_gap`, wrapping around the work-hour limit.
3. Continue assigning duties across the 720-hour horizon.
4. Compare fleet counts and inspect the resulting staggered schedule.

```python
# Illustrative initialization for each additional vehicle
initial_allowance = previous_allowance + t_gap
if initial_allowance > t_work:
    initial_allowance %= t_work
vehicle = create_vehicle(available_at=t, remaining_work=initial_allowance)
```

In the reported run, **five vehicles covered the full 30-day service horizon**.

## Schedule visualization

![Gantt chart showing staggered vehicle duties and maintenance](/media/206891a4-a5b40918ad.png)

## Try the application

[Open the fleet-rotation demo](https://huggingface.co/spaces/zhiyingchen/rostering-app)

The approach connects continuous service with maintenance planning and can be extended to personnel shifts, security coverage, and after-sales service scheduling.
