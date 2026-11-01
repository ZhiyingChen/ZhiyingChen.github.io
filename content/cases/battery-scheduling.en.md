+++
title = "Intelligent Scheduling for Battery Manufacturing"
date = "2025-06-04T15:59:19.307000+00:00"
lastmod = "2026-05-09T06:10:17.534000+00:00"
source_id = "208891a4-bd54-8014-a202-f9e5a4080c07"
source_url = "https://glowing-stetson-562.notion.site/208891a4bd548014a202f9e5a4080c07"
description = "Scheduling mixed-model battery production under changeover rules, ramp-up capacity, equipment constraints, and delivery objectives."
summary = "Scheduling mixed-model battery production under changeover rules, ramp-up capacity, equipment constraints, and delivery objectives."
eyebrow = "Battery manufacturing"
visual = "planning"
tags = ["MIP", "Pyomo", "CPLEX"]
weight = 100
portfolio = false
series_parent = "/projects/manufacturing-planning/"
series_title = "Master Production Planning & Manufacturing Coordination"
+++

## Project background

Mixed-model battery assembly combines tight process requirements with frequent changeovers and equipment constraints.

- **Changeover losses:** switching between models can trigger a capacity ramp-up, starting as low as 10% of normal output and gradually returning to 100%. Changeover-day losses can exceed 20%.
- **Equipment rules:** a production line makes one model per day, model switches need buffer periods, and equipment must run for a minimum number of days after startup.
- **Competing objectives:** the plan must balance overdue quantities, changeover frequency, and delivery timing.
- **Data scale:** the project involves more than 100,000 orders, thousands of equipment parameters, and capacity patterns that vary by month. Earlier approaches could take more than eight hours on large instances.

## Objectives and rules

The targets were to achieve on-time delivery above 95%, reduce changeovers by 30%, improve ramp-up utilization by 25%, and shorten average delivery lead time by 15%.

| Area | Rule |
| --- | --- |
| Changeovers | Switching between specifications within the same model family causes no changeover loss; switching families triggers a 1–4 day ramp-up |
| Capacity | Daily capacity depends on equipment count, production rate, and changeover/ramp-up losses; new equipment uses an initial discount such as `c_r` |
| Delivery | Late delivery is permitted but penalized; outstanding quantities are bounded by the original order and decrease over time |
| Equipment groups | Active equipment counts within a line group remain balanced, differing by at most one unit per day |

## Modeling approach

The solution combines **mixed-integer programming and set-covering-style production intervals**, implemented in Python and Pyomo with CPLEX.

The model includes:

- Inventory flow balance with production lead times, deliveries, and material consumption.
- Capacity constraints reflecting changeover and ramp-up losses.
- Production coverage intervals: an order's production fits within one continuous interval, and equipment on the same line shares interval boundaries.
- Objectives balancing overdue quantities, changeovers, and delivery timing.

## Solution strategy

1. Construct an initial set of production intervals and fix order–equipment relationships.
2. Refine the solution with symmetry-breaking constraints, including equipment-load balancing. In the reported benchmark, solve time decreased from **427 seconds to under 300 seconds**.
3. Adjust the interval step size, for example from one day to five or ten days, to balance detail and computation.
4. Apply ramp-up penalties to discourage costly changeovers.

## Application scenarios

- Mixed-model assembly covering more than 50 battery models and over 2,000 daily orders.
- Urgent-order insertion, with a replanning target of less than two hours.
- Monthly capacity simulations to assess how different ramp-up assumptions affect quarterly deliveries.

## Reported KPI comparison

| KPI | Before | After | Change |
| --- | --- | --- | --- |
| Order fulfillment | 76% | 97% | About +28% relative |
| Changeovers per day | 23 | 11 | −52% |
| Average delivery lead time | 28 days | 23 days | −17.9% |
| Capacity utilization | 72% | 89% | +23.6% relative |

Additional scenario results recorded in the case:

- Urgent-order response time: **4.5 hours → 1.2 minutes**.
- Peak-season equipment utilization: **68% → 89%**.

## Get in touch

This project was applied in the master planning system of a major lithium battery manufacturer. [Contact me](/contact/) to discuss its model structure and scheduling approach.
