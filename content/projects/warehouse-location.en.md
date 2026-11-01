+++
title = "Warehouse Network & Facility Location"
date = "2025-06-02T10:11:57.674000+00:00"
lastmod = "2026-05-09T06:11:15.657000+00:00"
source_id = "206891a4-bd54-8093-9154-ccc9a0db0dfa"
source_url = "https://glowing-stetson-562.notion.site/206891a4bd5480939154ccc9a0db0dfa"
description = "An interactive workflow for evaluating warehouse networks, facility choices, inventory allocation, customer assignments, and cost breakdowns."
summary = "An interactive workflow for evaluating warehouse networks, facility choices, inventory allocation, customer assignments, and cost breakdowns."
eyebrow = "Supply chains"
visual = "warehouse"
tags = ["Network planning", "Facility location", "Interactive application"]
weight = 50
portfolio = true
+++

## Project background

Where should warehouses be located? How many should open, how much inventory should each hold, and which customers should each serve?

This project turns those questions into an **interactive warehouse network planning tool**, allowing users to explore the trade-off between operating costs and service coverage.

![Warehouse planning application and result views](/media/35b891a4-5455b8e4ba.png)

## Input data

The application uses four CSV inputs:

| Input | Contents |
| --- | --- |
| Global parameters | Transport and storage rates, shortage penalties, interest, production costs, limits on warehouse count and inventory, and maximum delivery time |
| Demand locations | Customer cities and demand quantities |
| Candidate locations | Supply cities and candidate warehouses |
| Transport network | Distances and travel times between cities |

Users can start with sample data, edit the inputs, and solve again to compare scenarios.

## Decisions and constraints

The model decides **which warehouses to open, how much inventory to allocate, and how much to ship to each demand location**.

It enforces the following rules:

- Inventory can only be assigned to an open warehouse.
- Warehouse count and inventory levels must respect configured bounds.
- Shipments from a warehouse cannot exceed its inventory.
- Deliveries to a customer cannot exceed demand.
- Routes that exceed the delivery-time limit cannot be used.

The objective combines **storage, transportation, shortage, and capital costs**. Shortages carry a penalty, allowing the model to evaluate cost and service together.

## Interactive workflow

Built with **Streamlit and Pyomo**, the tool connects data preparation, linear or mixed-integer modeling, solving, and result explanation in one interface.

1. Upload the four input files or use the examples.
2. Review or edit parameters and city data.
3. Run the optimization model.
4. Inspect the selected warehouses, inventory levels, and shipment allocations.
5. Change assumptions and compare the resulting network.

## Results and explanations

The output includes:

- Total demand, coverage, and overall cost.
- A breakdown of storage, transport, shortage, and capital costs.
- Selected warehouses and their inventory and utilization levels.
- Shipment allocation tables.
- Demand fulfillment by customer city.

The example dataset contains **368 candidate locations, 5 demand cities, and 1,835 distance records**.

## My contribution

I was responsible for translating the business problem into a model, designing the input and output structure, implementing the Python/Pyomo optimization, building the Streamlit interface, and designing the result views.

The goal was to make the model reusable and its recommendations understandable to someone exploring a real network-planning decision.

## Try the application

[Open the warehouse planning demo](https://huggingface.co/spaces/zhiyingchen/warehouse_management_app)

The workflow can support multi-city planning in e-commerce, consumer goods, and logistics, as well as teaching and research.
