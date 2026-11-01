+++
title = "Ore Blending Optimization"
date = "2026-05-09T04:02:54.028000+00:00"
lastmod = "2026-05-09T04:06:01.670000+00:00"
source_id = "35b891a4-bd54-8016-b609-c206e8238610"
source_url = "https://glowing-stetson-562.notion.site/35b891a4bd548016b609c206e8238610"
description = "Selecting raw-material proportions by balancing grade, cost, and operational requirements."
summary = "Selecting raw-material proportions by balancing grade, cost, and operational requirements."
eyebrow = "Ore blending"
visual = "steel"
tags = ["Ore blending", "Raw materials", "Optimization modeling"]
weight = 100
portfolio = false
series_parent = "/projects/steel-optimization/"
series_title = "Raw Materials & Ironmaking Optimization"
+++

## Overview

This ore-blending project combines wet-basis prices, iron content, moisture, and chemical limits in one optimization model. It determines raw-material proportions under quality and usage constraints and evaluates economic performance through **cost per tonne of contained iron**.

## Business background

Ores from different sources vary in price, iron content, moisture, and chemistry. A low purchase price alone does not guarantee an economical blend.

The model considers those differences together with component bounds and minimum or maximum usage shares, helping users evaluate new ores and changes to the material mix.

## Objective and inputs

Given candidate ores, the model selects proportions so that:

- Total proportions sum to 100%.
- Each ore stays within its permitted usage range.
- The blended chemistry remains within quality limits.
- Cost per tonne of contained iron is minimized.

Excel inputs include time parameters, the material list, wet-basis prices, proportion bounds, chemical compositions, and lower and upper limits for each component.

## Modeling approach

The decision variables are the proportions of each ore. From these, the model calculates actual quantities, wet- and dry-basis relationships, weighted chemical compositions, dry-basis cost, and cost per tonne of contained iron.

**Water content receives explicit treatment**, because moisture changes both the effective material quantity and the cost basis.

The economic objective combines the blend's dry-basis price with its TFe content. Evaluating cost relative to effective iron content helps avoid selecting a cheap blend with poor iron yield.

## Solution workflow

1. Use linear programming to generate an initial solution satisfying basic proportion bounds and total-share constraints.
2. Run nonlinear optimization from that starting point to enforce chemical limits and improve the economic objective.
3. Check candidate acceptability, apply a time limit, and retain multiple solutions for comparison.

## Outputs

The model writes the final proportions, optimized material-cost results, and alternative candidates back to Excel. Users can compare several blends rather than inspect only one recommendation.

## My contribution

- Business abstraction and ore-blending logic.
- Material and chemical-component data structures.
- Initial feasible-solution generation.
- The nonlinear optimization workflow.
- Excel input and output design.

## Project value

The model brings material economics and quality limits into one runnable workflow. It supports rapid blend trials, evaluation of newly introduced ores, and adjustments to the overall raw-material structure.
