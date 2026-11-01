+++
title = "植树造林对云和降雨的影响地图可视化项目"
date = "2025-06-02T04:11:19.271000+00:00"
lastmod = "2026-05-09T03:46:01.581000+00:00"
source_id = "206891a4-bd54-8003-b45b-fa4ccab56eba"
source_url = "https://glowing-stetson-562.notion.site/206891a4bd548003b45bfa4ccab56eba"
description = "使用 Basemap 绘制中国植被分布图，整理植被、云量和地图数据，探索植树造林对云和降雨的影响。"
summary = "使用 Basemap 绘制中国植被分布图，整理植被、云量和地图数据，探索植树造林对云和降雨的影响。"
eyebrow = "数据可视化"
visual = "mapping"
tags = ["Python", "Basemap", "地理可视化"]
weight = 60
portfolio = true
+++

## <strong>Introduction</strong>

突然找到自己大二时候画的中国植被分布图代码，所以整理了一下代码做记录。这个项目主要用basemap进行地图可视化。

[https://github.com/ZhiyingChen/basemap_plot](https://github.com/ZhiyingChen/basemap_plot)

## <strong>Datasets</strong>

这是一个用Basemap库绘制分布的工程，部分相关数据放进了Datasets文件夹，来源如下。

````text
	数据集1:Land cover 植被数据
	Source: <https://glad.umd.edu/dataset/long-term-global-land-change>
	Details: 每年基于卫星探测的植被数据，其中涵盖了1982 - 2016年的三种不同类型（TC，SV，BG）

	数据集2:ERA-Interim 云量
	Source:<https://www.ecmwf.int/en/forecasts/datasets>
	Details: 1982 - 2016年LCC和TCC等因素的月平均数据

	数据集3:中国地图数据
	Source:<http://www.diva-gis.org/datadown>
````

## <strong>Plot</strong>

效果还挺好看的

<strong>[中国2016年TreeCover分布图]</strong>

![Distribution of TC in 2016.png](/media/206891a4-c0adac64bc.png)

<strong>[中国秦岭地区1983和2016年低矮云层四季分布对比图]</strong>

![QL Distribution of LCC.png](/media/206891a4-89152695d6.png)
