+++
title = "Mapping Afforestation, Clouds & Rainfall"
date = "2025-06-02T04:11:19.271000+00:00"
lastmod = "2026-05-09T03:46:01.581000+00:00"
source_id = "206891a4-bd54-8003-b45b-fa4ccab56eba"
source_url = "https://glowing-stetson-562.notion.site/206891a4bd548003b45bfa4ccab56eba"
description = "Visualizing vegetation across China with Basemap and organizing land-cover, cloud, and geographic data for environmental analysis."
summary = "Visualizing vegetation across China with Basemap and organizing land-cover, cloud, and geographic data for environmental analysis."
eyebrow = "Data visualization"
visual = "mapping"
tags = ["Python", "Basemap", "Geospatial visualization"]
weight = 60
portfolio = true
+++

## Background

I rediscovered code I wrote in my second undergraduate year to map vegetation across China and organized it into this project. It uses **Basemap for geographic visualization**, bringing together land-cover, cloud, and map data for environmental analysis.

[View the Basemap project on GitHub](https://github.com/ZhiyingChen/basemap_plot)

## Datasets

Some of the supporting data is included in the repository's `Datasets` folder.

| Dataset | Coverage and source |
| --- | --- |
| Land cover | Annual satellite-derived TC, SV, and BG data for 1982–2016, from the [Global Land Analysis and Discovery dataset](https://glad.umd.edu/dataset/long-term-global-land-change) |
| ERA-Interim cloud data | Monthly averages of low cloud cover (LCC), total cloud cover (TCC), and related variables for 1982–2016, from [ECMWF](https://www.ecmwf.int/en/forecasts/datasets) |
| China map data | Geographic boundaries from [DIVA-GIS](http://www.diva-gis.org/datadown) |

## Example visualizations

### Tree cover across China in 2016

![Distribution of tree cover across China in 2016](/media/206891a4-c0adac64bc.png)

### Seasonal low cloud cover in the Qinling Mountains

The maps compare the seasonal distribution of low cloud cover in **1983 and 2016**.

![Seasonal low cloud cover in the Qinling Mountains, comparing 1983 and 2016](/media/206891a4-89152695d6.png)
