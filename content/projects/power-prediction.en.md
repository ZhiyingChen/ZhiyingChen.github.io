+++
title = "PV Module Power Distribution & Material Mix Optimization"
date = "2026-11-21T12:00:00+08:00"
description = "Optimize material proportions against power-bin demand, balancing shortages, surplus output, downgrading and material cost."
summary = "Explore how material distributions and blend decisions affect PV module power bins and order fulfillment."
eyebrow = "PHOTOVOLTAICS · MATERIAL MIX"
visual = "power"
tags = ["Power distribution", "Material mix", "CPLEX"]
weight = 16
portfolio = true
demo_url = "/demos/power-prediction/"
+++

## Interactive demo

[Open Power Studio](/demos/power-prediction/) — the interactive workspace currently uses Chinese labels.

Following the Column Studio workflow, the demo explains the problem, lets visitors configure and run scenarios, visualizes the results and documents the method. Change the demand CSV, material limits, number of materials, downgrade allowance and objective weights. Compare power-bin demand and expected output, inspect blend proportions and downgrade flows, and export CSV or JSON. All sample data is fictional and computed locally in the browser.

## The problem

Each material and cell-grade combination has a different module power distribution. Orders require quantities in particular power bins, so enough total output can still leave a high-power shortage alongside low-power surplus. This project links material allocation to expected power output and demand matching, accounting for shortages, byproducts and downgrading. “Prediction” refers to expected output from supplied distributions.

## Original model and demo scope

The Python project uses modular Context and model builders for monthly prediction, daily prediction and material optimization, with Pyomo / CPLEX. The monthly model connects material and cell-grade proportions to power output, demand fulfillment and downgrade decisions; the daily model adds period demand and inventory.

The demo searches three fixed material/cell-grade combinations in 5% blend increments for one batch. Quantities represent expectations. Direct matches are allocated first, followed by higher-power surplus assigned to lower-power demand, serving higher demand bins first and using the nearest eligible surplus bin. The scoring formula and candidate count are shown in the interface.

This educational approximation does not guarantee the global optimum of the industrial model. Shared supply across orders, order binding, contiguous grade constraints, daily inventory and the full material optimization module are outside its scope.

[Project source](https://github.com/ZhiyingChen/power_prediction)
