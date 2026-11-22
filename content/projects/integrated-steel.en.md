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
weight = 35
portfolio = true
demo_url = "/demos/integrated-steel/"
aliases = ["/cases/integrated-steel/"]
+++

## Interactive demo

[Open Ore Studio · Integrated ore blending](/demos/integrated-steel/) — the workspace currently uses Chinese labels.

Following the Column Studio workflow, explore the problem, edit fictional ore prices and chemistry, set quality and availability limits, run a scenario, inspect blend proportions and cost breakdowns, and export CSV or JSON. Calculations run locally in the browser.

The demonstration enumerates a simplified discrete model: 5% ore and burden increments and 25% internal pellet increments, with fixed yields and simplified iron balance and fuel relationships. It does not guarantee a continuous global optimum. Full chemistry, return fines, and the original Grid / GRASP + SLSQP solver require the project's separate Python Web service. Demo results are not evidence of real business impact.

## Overview

I built a **nonlinear ore-blending model that connects sintering and ironmaking**, minimizing total cost per tonne of hot metal. It accounts for raw-material chemistry, moisture, ignition losses, return fines, fuel use, slag basicity, and downstream cost effects.

An Excel-based workflow supports both individual solves and batches of scenarios.

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
