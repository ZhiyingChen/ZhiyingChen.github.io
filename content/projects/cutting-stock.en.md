+++
title = "Cutting Stock & Column Generation"
date = "2025-06-03T15:42:53.642000+00:00"
lastmod = "2026-05-09T06:11:10.740000+00:00"
source_id = "207891a4-bd54-809f-9d95-cc8943ccd895"
source_url = "https://glowing-stetson-562.notion.site/207891a4bd54809f9d95cc8943ccd895"
description = "A column-generation framework for cutting orders across multiple days and sizes, with pattern generation and remnant management in Pyomo and GLPK."
summary = "A column-generation framework for cutting orders across multiple days and sizes, with pattern generation and remnant management in Pyomo and GLPK."
eyebrow = "Operations research"
visual = "cutting"
tags = ["Column generation", "Pyomo", "Cutting stock"]
weight = 40
portfolio = true
+++

## Project background

Manufacturers, packaging companies, and logistics operators often cut large rolls or sheets of material into smaller sizes to meet daily orders. Choosing the right cutting patterns helps make better use of stock while reducing scrap and processing effort.

I developed a **column-generation framework for orders spanning multiple days and sizes**, using Pyomo and GLPK to model the problem and generate patterns iteratively.

## Problem definition

![Illustration of stock, cutting patterns, and demand](/media/227891a4-81497fd95b.png)

- Each day has demand for specified widths and quantities.
- Stock has a fixed width, and each roll has a maximum number of cuts.
- A remainder above the reusable threshold can return to inventory; smaller pieces become scrap.
- Each pattern specifies a combination of required sizes.
- The objective is to **minimize the number of stock units used while meeting daily demand**, with explicit control over waste.

## Example parameters

| Parameter | Meaning |
| --- | --- |
| `original_size` | Width of the stock material |
| `demand_dict[date]` | Size and quantity requirements for a given day |
| `max_cut` | Maximum number of cuts per roll |
| `waste_up_limit / low_limit` | Thresholds for scrap and reusable remnants |
| `min_pattern_used_num` | Minimum pattern-use setting for feasibility control |
| `consider_waste` | Whether to model waste handling |
| `whether_process_remain` | Whether to process outstanding demand |

## Model structure

The framework has three components.

### Integer master problem

Given the final pattern set, a mixed-integer model determines how often to use each pattern. It meets demand for every size and minimizes stock consumption.

### Restricted linear master problem

The current patterns form an LP relaxation. Solving it provides dual prices for each required size, which guide the search for new patterns.

### Pricing subproblem

A knapsack-style integer model uses those dual prices to find a new pattern with negative reduced cost. It also includes the logic for deciding whether a remainder can be stored.

```text
Stock width L = 1000

| 120 | 120 | 300 |       reusable remainder

Remainder = 1000 - (2 × 120 + 1 × 300) = 460
```

## Solution workflow

The `Context` class organizes the following steps:

1. Read demand for a date and initialize cutting patterns.
2. Solve the restricted master problem and obtain dual prices.
3. Solve the pricing subproblem and add any improving patterns.
4. Repeat until pricing finds no improvement.
5. Solve the final integer model and export the cutting plan.
6. Process multiple days sequentially or in parallel.

## Implementation highlights

- An encapsulated column-generation workflow.
- Configurable remnant policies that distinguish reusable material from scrap.
- Parallel daily solves with Joblib.
- Clear interfaces for extending the objective and business rules.
- Tested on multiple practical cutting scenarios.

## Try the application

[Open the interactive cutting-stock demo](https://huggingface.co/spaces/zhiyingchen/column-generation-app)

## Applications

The same approach can support steel, cardboard, and textile cutting; packaging and logistics; inventory policies for remnants; and related box, template, and sheet-utilization problems.

## My contribution

I designed, implemented, and deployed this application independently. My work focuses on industrial optimization and turning algorithms into interactive tools.

[More about my experience](/about/) · [Get in touch](/contact/)
