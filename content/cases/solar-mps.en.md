+++
title = "Master Production Planning for Photovoltaics"
date = "2025-06-04T15:37:09.703000+00:00"
lastmod = "2026-05-09T06:10:37.242000+00:00"
source_id = "208891a4-bd54-801e-873c-c1fd4345cb63"
source_url = "https://glowing-stetson-562.notion.site/208891a4bd54801e873cc1fd4345cb63"
description = "Coordinating crystal growth and wafer slicing with equipment states, coupled capacity constraints, and long-term delivery targets."
summary = "Coordinating crystal growth and wafer slicing with equipment states, coupled capacity constraints, and long-term delivery targets."
eyebrow = "Photovoltaic manufacturing"
visual = "planning"
tags = ["MPS", "Photovoltaics", "Capacity planning"]
weight = 100
portfolio = false
series_parent = "/projects/manufacturing-planning/"
series_title = "Master Production Planning & Manufacturing Coordination"
+++

## Project background

Photovoltaic manufacturing requires daily master planning across a long horizon, coordinating **crystal growth and wafer slicing** under equipment and process constraints.

The key challenges include:

- Balancing capacity across the two stages.
- Limits on equipment availability and daily startups or shutdowns.
- Full-production and minimum-run requirements after startup.
- Reduced first-day capacity for newly started slicing equipment.
- Monthly crystal-growth capacity, crystallization rates, and finished-product rates, with yield calculated as finished-product rate divided by crystallization rate.
- Day-level decisions across a full year, while meeting delivery and inventory requirements.

## Planning objectives

The model prioritizes overdue-quantity reduction, then improves inventory, equipment balance, and capacity utilization. It seeks to avoid both material accumulation and shortages while keeping production stable within each production organization.

## Main operating rules

| Area | Rules |
| --- | --- |
| Equipment | Daily startups and shutdowns are bounded; started equipment must operate at full output and remain active for a minimum run |
| Crystal growth | Monthly capacity, crystallization rate, and finished-product rate are inputs; their ratio determines yield |
| Wafer slicing | Monthly capacity is specified; newly started equipment uses a first-day capacity discount such as `c_r` |
| Inventory and deliveries | Minimum inventory requirements apply; outstanding orders decrease over time and cannot exceed their original quantities |

## Modeling framework

![Decomposition of the photovoltaic planning problem; original diagram in Chinese](/media/208891a4-c2f1e9bb2a.png)

The solution uses **mixed-integer programming, Python, and Pyomo**, with a solver such as CPLEX.

Sets represent items, inventory points, periods, production steps, resources, and production organizations. Variables describe active equipment, production quantities, inventory, and deliveries. Parameters describe production rates, start/stop limits, and capacity discounts.

The core constraints enforce:

- **Inventory balance:** ending stock equals opening stock plus production and arrivals, minus consumption and deliveries.
- **Capacity:** processing requirements fit within available time, including startup losses and full-output rules.
- **Balanced production:** auxiliary variables control differences in active equipment counts within a production organization.

## Translating business rules into constraints

| Business rule | Model treatment |
| --- | --- |
| Start or stop at most two machines daily; keep a started machine running for seven days | Binary state variables and rolling-window constraints |
| Set crystal-growth capacity by month and calculate yield from process rates | Monthly piecewise parameterization and linearization |
| New slicing equipment produces at 70% on day one, then 100% | Equipment-state indicators linked to conditional capacity |

## Technical capabilities

- Hierarchical objectives prioritize customer fulfillment before resource balance.
- Equipment states are linked directly to discounted capacity.
- Joint planning reduces conflicts such as slicing equipment waiting for upstream material.
- Scenario planning can identify capacity gaps over the next 30 days and support advance equipment preparation.
- Start/stop plans can be adjusted when urgent orders arrive.

## Reported results

| KPI | Baseline | Optimized | Change |
| --- | --- | --- | --- |
| On-time delivery | 86% | 98% | About +14% relative |
| Equipment switches per month | 32 | 18 | −44% |
| Capacity fluctuation coefficient | 0.28 | 0.12 | −57% |

## Get in touch

This project was applied in the master planning system of a major photovoltaic manufacturer. [Contact me](/contact/) to discuss the model, business constraints, or implementation.
