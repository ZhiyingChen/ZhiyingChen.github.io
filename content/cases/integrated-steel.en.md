+++
title = "Integrated Sintering & Ironmaking Optimization"
date = "2026-05-09T04:02:53.876000+00:00"
lastmod = "2026-05-09T08:51:02.763000+00:00"
source_id = "35b891a4-bd54-8014-9455-c56e725ece2c"
source_url = "https://glowing-stetson-562.notion.site/35b891a4bd5480149455c56e725ece2c"
description = "Minimizing cost per tonne of hot metal through coordinated raw-material selection and blending across sintering and ironmaking."
summary = "Minimizing cost per tonne of hot metal through coordinated raw-material selection and blending across sintering and ironmaking."
eyebrow = "Iron & steel"
visual = "steel"
tags = ["Ore blending", "Sintering & ironmaking", "Cost minimization"]
weight = 100
portfolio = false
series_parent = "/projects/steel-optimization/"
series_title = "Raw Materials & Ironmaking Optimization"
+++

## Overview

I built a **nonlinear ore-blending model that connects sintering and ironmaking**, minimizing total cost per tonne of hot metal. It accounts for raw-material chemistry, moisture, ignition losses, return fines, fuel use, slag basicity, and downstream cost effects.

An Excel-based workflow supports both individual solves and batches of scenarios.

## Reported project results

The model has been run with real production data to help a steelworks evaluate blends that satisfy grade and slag-basicity requirements. It replaces a slow, experience-led adjustment process with faster calculations and scenario comparisons.

The original project records an **average cost reduction of approximately 16.7% per tonne of hot metal and monthly savings of around RMB 3 million**.

## Business background

An inexpensive ore can create additional costs through sintering performance, coke and injected-coal consumption, slag load, or hot-metal quality. Blending decisions therefore affect the economics of the whole process.

- The sinter blend determines sinter composition and cost.
- Sinter composition affects blast-furnace burden grade, load, and fuel consumption.
- The final evaluation must consider the total cost per tonne of hot metal.

## Model structure

### Sintering stage

The inputs include reference ores, blended ores, newly introduced ores, fuels, and additives. The model combines price, chemistry, moisture, ignition loss, dry-basis quantity, retained mass after ignition, and unit consumption to calculate sinter cost and composition.

### Ironmaking stage

The sinter results feed into calculations for:

- The mix of basic and acidic burden materials.
- Coke and pulverized-coal consumption.
- Overall burden grade and ore-to-hot-metal ratios.
- Chemical-element loads.
- Slag quantity, composition, and basicity.

The two stages share a common economic objective, so upstream decisions reflect their downstream consequences.

## Excel inputs

The workbook contains fixed parameters, component and fuel allocations, sintering raw materials, ironmaking burden materials, coke and injected coal, slag constraints, sintering and hot-metal costs, and a table of repeated-run scenarios.

This structure lets business users maintain familiar tables and run scenario analysis without changing the model code.

## Main constraints

- Lower and upper bounds on sintering-additive proportions.
- Limits on the total additive share.
- Overall burden-grade requirements.
- Lower and upper bounds for the magnesium-to-alumina ratio and binary, ternary, and quaternary basicity indices.

These constraints keep candidate solutions within acceptable operating ranges.

## Cost objective

The total hot-metal cost includes sintering raw materials and processing, ironmaking materials, coke and injected coal, element-load effects, overall-grade effects, and hot-metal processing and adjustment costs.

## Solution workflow

1. Generate a starting point from additive bounds and an initial solve.
2. Use nonlinear optimization to refine the coupled process decisions.
3. Write the results back to Excel.
4. Optionally read the repeated-run table, vary new-ore parameters or blending ratios, and record each scenario's results.

Starting from a structured initial solution improves stability when the business formulas are nonlinear and strongly coupled.

## My contribution

I was responsible for business abstraction, the integrated sintering–ironmaking logic, nonlinear objectives and constraints, the Excel interface, and the single-run and batch workflows.

The project demonstrates how I turn industrial relationships among materials, processes, costs, and operating limits into a decision model that fits an existing business analysis workflow.
