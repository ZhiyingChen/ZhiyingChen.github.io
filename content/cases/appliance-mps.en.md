+++
title = "Master Planning for Appliance Manufacturing"
date = "2025-06-04T15:12:43.734000+00:00"
lastmod = "2026-05-09T06:10:41.781000+00:00"
source_id = "208891a4-bd54-80fc-b8e4-ed608e1593be"
source_url = "https://glowing-stetson-562.notion.site/208891a4bd5480fcb8e4ed608e1593be"
description = "An extensible master planning model integrating demand, BOMs, procurement, production, inventory, and transportation."
summary = "An extensible master planning model integrating demand, BOMs, procurement, production, inventory, and transportation."
eyebrow = "Appliance manufacturing"
visual = "planning"
tags = ["MPS", "Supply chains", "Inventory balance"]
weight = 100
portfolio = false
series_parent = "/projects/manufacturing-planning/"
series_title = "Master Production Planning & Manufacturing Coordination"
+++

## Project background

Appliance manufacturing involves many product variants and interconnected procurement, warehousing, production, and transportation processes. A workable plan must reconcile customer demand with material availability and resource capacity.

This project provides an **extensible master planning framework** that jointly optimizes production, procurement, inventory, and transportation. It is designed for discrete manufacturing, including air conditioners, refrigerators, and washing machines.

![Overview of the appliance master planning model; original diagram in Chinese](/media/208891a4-5f26d394a3.png)

## Problem definition

Under resource and supply constraints, the model aims to reduce:

- The number and quantity of overdue orders.
- Excess inventory and unnecessary production.
- Procurement, production, transportation, and other operating costs.

Time-phased planning and a separate supply-allocation layer support complex BOMs, resource scheduling, and multi-level inventory policies.

## Business workflow

```text
Customer demand → BOM explosion → Identify relevant inventory points
                         ↓
             Build orders and the supply network
                         ↓
        Joint production and procurement optimization
                         ↓
        Procurement / production / transport / inventory plans
                         ↓
          Post-process explicit supply allocations
```

## Model structure

### Master planning model

The model derives relevant materials, inventory nodes, and transport paths from orders and BOMs, then creates a reusable set of decision variables.

Its constraints cover:

- Material balance and flow conservation.
- Safety-stock lower and upper bounds.
- Joint production and co-product relationships.
- Resource availability and production capacity.
- Minimum purchase and shipment quantities, including binary activation variables.

A staged objective first reduces overdue orders, then improves operating costs. Relaxation limits between stages help maintain stable results.

### Supply-allocation model

A second model makes the implicit **“which supply serves which demand”** relationships explicit. It allocates supply to demand and inventory, with priorities for final customer orders, planned orders, and inventory requirements.

### Supported capabilities

- Unified planning across procurement, production, transportation, and inventory.
- Automatic model construction from orders and BOMs.
- Multiple resource types and process routes.
- Joint management of order fulfillment and excess supply.
- Configurable priorities, including overdue quantities before cost.
- Planning that can include both historical backlogs and future orders.

## Example project results

| KPI | Before | After | Change |
| --- | --- | --- | --- |
| On-time delivery rate | 76% | 97% | +21 percentage points |
| Number of overdue orders | 45 | 4 | −91% |
| Procurement planning accuracy | 15% excess | Within ±2% | Improved control |
| Critical resource utilization | Substantial variation | Average increase of 18% | Improved |
| Model solve time | — | 1–2 minutes on average | — |

These figures come from the appliance project samples described in the original case, covering freezer and air-conditioning products.

## Applications

- **Air conditioners:** multiple lines and product changeovers.
- **Refrigerators:** deep intermediate-product BOMs and scarce production resources.
- **Lithium battery modules:** transport across sites and multi-step processes.
- **Automotive components:** limited inventory and multi-level material distribution.

## Get in touch

This framework has been applied in manufacturing projects. [Contact me](/contact/) to discuss the model structure, planning logic, or algorithm details.
