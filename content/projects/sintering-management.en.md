+++
title = "Sintering Optimization"
date = "2026-05-09T04:02:54.116000+00:00"
lastmod = "2026-05-09T04:06:10.751000+00:00"
source_id = "35b891a4-bd54-8007-9133-ef2e76227c14"
source_url = "https://glowing-stetson-562.notion.site/35b891a4bd5480079133ef2e76227c14"
description = "Optimizing raw-material blends and costs in the sintering process under metallurgical and operational constraints."
summary = "Optimizing raw-material blends and costs in the sintering process under metallurgical and operational constraints."
eyebrow = "Sintering"
visual = "steel"
tags = ["Sintering", "Blending optimization", "Cost optimization"]
weight = 25
portfolio = true
demo_url = "/demos/sintering-management/?lang=en"
aliases = ["/cases/sintering-management/", "/projects/steel-optimization/"]
+++

## Interactive demo

[Open Sinter Studio · Sintering Blend Optimization](/demos/sintering-management/?lang=en)

Edit synthetic material prices, moisture, ignition losses, blend limits and chemistry in a Chinese-language workspace. Compare blend proportions, dry-basis cost per tonne of sinter, and every quality constraint; export CSV or JSON. Computation runs locally in your browser.

The demo retains the original dry-basis, retained-mass and component-removal formulas for a single batch with seven chemical components and three ratios. It solves an equivalent linear program under positive-denominator assumptions, then verifies the original formulas. The original Python model uses SLSQP / basinhopping and includes more chemical components and candidate solutions. The ratio called “ternary basicity” in the source is explicitly shown here as Al₂O₃ / SiO₂. All sample data and prices are fictional.

## Overview

This project optimizes the **raw-material blend for the sintering process**, combining prices, ignition losses, moisture, chemistry, and slag-basicity constraints. The aim is to reduce raw-material costs while maintaining acceptable sinter quality and operating indicators.

## Business background

Sintering decisions affect both the current process cost and the quality of the burden entering the blast furnace. A useful model must account for price, moisture, ignition loss, composition, basicity, and limits on each material's usage.

## Inputs

The Excel workbook provides:

- Material information and initial proportions.
- Unit prices, ignition losses, and moisture.
- Chemical compositions and their allowable bounds.
- Slag-basicity limits.
- Solver time-limit parameters.

The model captures the specific process relationships of sintering.

## Modeling approach

Material proportions are the decision variables. The model derives dry-basis quantities, retained mass after ignition, effective component quantities, raw-material consumption per unit of sinter, and material costs.

It also calculates process indicators such as the **magnesium-to-alumina ratio, binary basicity, and ternary basicity**.

## Main constraints

- Individual material proportions must stay within their bounds.
- Total proportions equal 100%.
- Chemical compositions remain within permitted ranges.
- Slag-basicity indicators satisfy lower and upper limits.

## Objective

The default objective minimizes raw-material cost. The implementation also retains an alternative expression based on internal cost relative to retained mass after ignition, providing a foundation for further economic indicators.

## Solution workflow

A linear program first generates a starting solution satisfying basic proportion constraints. Nonlinear optimization then enforces composition and basicity requirements while searching for a lower-cost blend.

Constraint checks, a time limit, and candidate-solution storage make results easier to compare under complex operating rules.

## Outputs

The workbook receives the final material proportions, the main solution, and several alternatives. This supports repeated process analysis and scenario comparison.

## My contribution

I handled process abstraction, data structures, Excel input/output design, composition and basicity modeling, initialization and nonlinear optimization, and the comparison of candidate solutions.

The project shows how process knowledge can become a computational model for designing and checking practical sintering blends.
