"""Convert the archived public Notion blocks into editable Hugo Markdown.

Run only when intentionally re-importing: this overwrites migrated content.
Normal website builds do not need Python, Notion, or this script.
"""

from __future__ import annotations

import html
import json
from datetime import datetime, timezone
from pathlib import Path
import re
import sys
import urllib.parse

from import_notion import ARCHIVE, HOME_ID, ROOT, descendants, title

META = {
    "35b891a4-bd54-8029-9bc4-cfdbe5549dcd": ("manufacturing-planning", "制造计划", "planning", "把需求、产能、库存、采购、工艺约束和交付目标放到同一个优化框架里，形成真正可执行的生产计划。", ["MPS", "制造协同", "混合整数规划"]),
    "208891a4-bd54-8098-9ea7-d08d1ec54c6d": ("steel-optimization", "流程工业", "steel", "将原料价格、品位、烧损、返粉、燃耗、炉渣指标和吨铁成本放入同一个分析框架，支持不同层级的决策。", ["配矿优化", "成本建模", "流程联动"]),
    "35b891a4-bd54-803d-9ed2-ebde61546a8e": ("vehicle-scheduling", "调度优化", "routing", "在有限车辆资源下，平衡持续服务、维修周期与任务约束，从单车种维修错峰扩展到多车种与 ALNS 搜索。", ["车辆轮转", "ALNS", "维修调度"]),
    "207891a4-bd54-809f-9d95-cc8943ccd895": ("cutting-stock", "运筹算法", "cutting", "面向多天、多规格订单的切割优化，基于列生成框架与 Pyomo + GLPK，实现模式生成与残料管理。", ["列生成", "Pyomo", "切割优化"]),
    "206891a4-bd54-8093-9154-ccc9a0db0dfa": ("warehouse-location", "供应链", "warehouse", "通过可交互的分析流程，评估仓网布局，输出建仓选择、库存配置、客户分配和成本拆解结果。", ["仓网规划", "选址模型", "交互应用"]),
    "206891a4-bd54-8003-b45b-fa4ccab56eba": ("climate-mapping", "数据可视化", "mapping", "使用 Basemap 绘制中国植被分布图，整理植被、云量和地图数据，探索植树造林对云和降雨的影响。", ["Python", "Basemap", "地理可视化"]),
    "35b891a4-bd54-80e0-bd6f-eed6faa47e89": ("reinforcement-learning", "学习与研究", "learning", "围绕强化学习经典算法进行代码复现，整理实验入口、算法实现、环境工具和运行记录。", ["强化学习", "算法复现", "Python"]),
    "208891a4-bd54-8014-a202-f9e5a4080c07": ("battery-scheduling", "锂电制造", "planning", "在高精度、多型号混线生产场景中，结合换型规则、爬坡产能和交付目标，建立锂电池制造排程模型。", ["MIP", "Pyomo", "CPLEX"]),
    "208891a4-bd54-801e-873c-c1fd4345cb63": ("solar-mps", "光伏制造", "planning", "面向光伏拉晶与切片场景，把设备启停、工序能力耦合和长期交付目标纳入主生产计划优化。", ["MPS", "光伏", "产能规划"]),
    "208891a4-bd54-80fc-b8e4-ed608e1593be": ("appliance-mps", "家电制造", "planning", "构建覆盖需求、BOM、采购、生产、库存与运输协同的可扩展主计划优化模型。", ["MPS", "供应链", "库存平衡"]),
    "35b891a4-bd54-8007-9133-ef2e76227c14": ("sintering-management", "烧结优化", "steel", "面向烧结工序的原料与成本优化模型，结合工艺约束分析配料方案。", ["烧结", "配料优化", "成本优化"]),
    "35b891a4-bd54-8016-b609-c206e8238610": ("mixed-mine-management", "混矿优化", "steel", "面向原料混矿场景，结合品位、成本与业务约束进行配比决策。", ["混矿", "原料管理", "优化建模"]),
    "35b891a4-bd54-8014-9455-c56e725ece2c": ("integrated-steel", "钢铁配矿", "steel", "以吨铁成本最小化为目标，联动烧结与炼铁工序的原料选择及配比方案。", ["钢铁配矿", "烧结炼铁", "成本最小化"]),
    "206891a4-bd54-8051-af47-d464a5fd57a9": ("single-fleet", "车辆轮转", "routing", "单车种条件下的车辆轮转与维修错峰，探索满足持续服务需求的最小车辆数。", ["维修错峰", "车辆轮转", "菱形算法"]),
    "206891a4-bd54-8033-87c8-eb0d841bbe3a": ("multi-fleet-alns", "车辆轮转", "routing", "将单车种调度扩展到多车种与任务组合，并结合 ALNS 设计更通用的搜索框架。", ["ALNS", "多车种", "组合优化"]),
}


def clean_title(value):
    return re.sub(r"^[^\w\u3400-\u9fff]+", "", value).strip()


def quote(value):
    return json.dumps(value, ensure_ascii=False)


class Exporter:
    def __init__(self):
        self.manifest = json.loads((ARCHIVE / "manifest.json").read_text(encoding="utf-8"))
        self.pages = {item["id"]: json.loads((ARCHIVE / "pages" / (item["id"] + ".json")).read_text(encoding="utf-8")) for item in self.manifest["pages"]}
        self.media = {(item["block_id"], item["source"]): item for item in self.manifest["media"]}
        self.routes = {HOME_ID: "/about/"}
        self.routes.update({pid: "/" + ("projects" if pid in self.manifest["project_ids"] else "cases") + "/" + meta[0] + "/" for pid, meta in META.items()})
        self.converted = set()
        self.block_anchors = set()
        self.parents = {}
        for page in self.pages.values():
            for b in descendants(page):
                if b.get("type") == "collection_view":
                    for pid in self.manifest["collections"].get(b["id"], []):
                        self.parents[pid] = page["page_id"]
        for page in self.pages.values():
            for b in descendants(page):
                for spans in b.get("properties", {}).values():
                    for span in spans:
                        for ann in span[1] if len(span) > 1 else []:
                            if ann[0] == "a" and "notion" in ann[1] and "#" in ann[1]:
                                fragment = urllib.parse.urlparse(ann[1]).fragment.replace("-", "")
                                if re.fullmatch(r"[a-f0-9]{32}", fragment):
                                    self.block_anchors.add(fragment)

    def link(self, url):
        if url == "mailto:ada@yourdomain.com":
            return "mailto:nicolec1999@foxmail.com"
        parsed = urllib.parse.urlparse(url)
        if ".notion." in parsed.netloc or "notion.site" in parsed.netloc or (not parsed.netloc and url.startswith("/")):
            compact = parsed.path.replace("-", "")
            for pid, route in self.routes.items():
                if pid.replace("-", "") in compact:
                    return route + ("#notion-" + parsed.fragment.replace("-", "") if parsed.fragment else "")
        return url

    def rich(self, spans):
        parts = []
        for span in spans:
            if not span:
                continue
            raw = str(span[0])
            annotations = span[1] if len(span) > 1 else []
            codes = {a[0]: a for a in annotations}
            if "p" in codes:
                pid = codes["p"][1]
                if pid in self.pages:
                    raw = clean_title(title(self.pages[pid]["blocks"][pid]))
            value = html.escape(raw).replace("*", "\\*").replace("_", "\\_")
            if "c" in codes:
                value = "<code>" + html.escape(raw) + "</code>"
            for code, tag in [("b", "strong"), ("i", "em"), ("s", "del"), ("_", "u")]:
                if code in codes:
                    value = "<" + tag + ">" + value + "</" + tag + ">"
            if "a" in codes:
                url = self.link(codes["a"][1])
                value = "[" + value.replace("[", "\\[").replace("]", "\\]") + "](" + url.replace(" ", "%20") + ")"
            elif "p" in codes and codes["p"][1] in self.routes:
                value = "[" + value + "](" + self.routes[codes["p"][1]] + ")"
            parts.append(value)
        return "".join(parts)

    def blocks(self, ids, page, depth=0):
        output = []
        for bid in ids:
            if bid not in page["blocks"]:
                raise RuntimeError("Missing block " + bid)
            b = page["blocks"][bid]
            self.converted.add(bid)
            kind = b.get("type")
            props = b.get("properties", {})
            text = self.rich(props.get("title", []))
            if title(b).startswith("电子邮件：") and "mailto:ada@yourdomain.com" in json.dumps(props):
                text = "电子邮件：[nicolec1999@foxmail.com](mailto:nicolec1999@foxmail.com)"
            children = b.get("content", [])
            anchor = '<span id="notion-' + bid.replace("-", "") + '"></span>\n\n' if bid.replace("-", "") in self.block_anchors else ""
            body = ""
            if kind == "text":
                body = text + ("\n\n" + self.blocks(children, page, depth) if children else "")
            elif kind in ("header", "sub_header", "sub_sub_header"):
                levels = {"header": 2, "sub_header": 3, "sub_sub_header": 4}
                base = min((levels.get(x.get("type"), 99) for x in descendants(page)), default=2)
                body = "#" * (levels[kind] - base + 2) + " " + text
                if children:
                    body += "\n\n" + self.blocks(children, page, depth)
            elif kind in ("bulleted_list", "numbered_list", "to_do"):
                marker = "1. " if kind == "numbered_list" else "- "
                if kind == "to_do":
                    marker += "[x] " if props.get("checked") == [["Yes"]] else "[ ] "
                body = marker + text.replace("\n", "\n   ")
                if children:
                    nested = self.blocks(children, page, depth + 1)
                    body += "\n\n" + "\n".join("    " + line if line else "" for line in nested.splitlines())
            elif kind in ("column_list", "column", "transclusion_container"):
                body = self.blocks(children, page, depth)
            elif kind in ("callout", "quote"):
                value = text + ("\n\n" + self.blocks(children, page, depth) if children else "")
                body = "\n".join("> " + line for line in value.strip().splitlines())
            elif kind == "divider":
                body = "---"
            elif kind == "image":
                source = props.get("source", [[""]])[0][0]
                item = self.media[(bid, source)]
                if item.get("error"):
                    raise RuntimeError("Media was not downloaded: " + source)
                alt = title(b) or "项目插图"
                caption = self.rich(props.get("caption", []))
                image_path = item["path"]
                if item["source"].endswith(":PA100578.jpg") and (ROOT / "static/media/205891a4-071118da70.webp").exists():
                    image_path = "/media/205891a4-071118da70.webp"
                small_icon = b.get("format", {}).get("block_width", 1000) <= 32
                body = "![" + alt.replace("[", "").replace("]", "") + "](" + image_path + (' "inline-icon"' if small_icon else "") + ")"
                if caption:
                    body += "\n\n" + caption
            elif kind in ("file", "pdf", "video", "audio"):
                source = props.get("source", [[""]])[0][0]
                item = self.media[(bid, source)]
                body = "[" + (text or item["filename"]) + "](" + item["path"] + ")"
            elif kind == "code":
                language = props.get("language", [["text"]])[0][0].lower()
                language = {"plain text": "text", "c++": "cpp"}.get(language, language)
                body = "````" + language + "\n" + title(b).rstrip() + "\n````"
            elif kind == "table":
                columns = b.get("format", {}).get("table_block_column_order", [])
                rows = []
                for child in children:
                    row = page["blocks"][child]
                    self.converted.add(child)
                    rows.append("| " + " | ".join(self.rich(row.get("properties", {}).get(col, [])).replace("|", "\\|").replace("\n", "<br>") for col in columns) + " |")
                if rows:
                    rows.insert(1, "| " + " | ".join("---" for _ in columns) + " |")
                    body = "\n".join(rows)
            elif kind in ("bookmark", "embed", "external_object_instance", "link_preview"):
                url = props.get("link", props.get("source", [[b.get("format", {}).get("original_url", "")]]))[0][0]
                body = "[" + (text or url) + "](" + self.link(url) + ")" if url else text
            elif kind in ("collection_view", "collection_view_page"):
                body = "\n\n".join("- [" + clean_title(title(self.pages[pid]["blocks"][pid])) + "](" + self.routes[pid] + ")" for pid in self.manifest["collections"].get(bid, []))
            elif kind in ("page", "link_to_page"):
                target = bid if kind == "page" else b.get("format", {}).get("page_id")
                body = "[" + clean_title(text) + "](" + self.routes[target] + ")"
            elif kind == "toggle":
                body = "<details>\n<summary>" + text + "</summary>\n\n" + self.blocks(children, page, depth) + "\n\n</details>"
            elif kind == "equation":
                body = "$$\n" + title(b) + "\n$$"
            else:
                raise RuntimeError("Unsupported block type: " + str(kind))
            if body.strip():
                output.append(anchor + body.strip())
        return "\n\n".join(output) + "\n"

    def run(self):
        project_ids = self.manifest["project_ids"]
        report = []
        for pid, page in self.pages.items():
            page_block = page["blocks"][pid]
            self.converted.add(pid)
            route = self.routes[pid]
            output_path = ROOT / "content" / (route.strip("/") + ".md")
            output_path.parent.mkdir(parents=True, exist_ok=True)
            meta = META.get(pid)
            name = clean_title(title(page_block)) if meta else "关于我"
            created = datetime.fromtimestamp(page_block["created_time"] / 1000, timezone.utc).isoformat()
            edited = datetime.fromtimestamp(page_block["last_edited_time"] / 1000, timezone.utc).isoformat()
            frontmatter = ["+++", "title = " + quote(name), "date = " + quote(created), "lastmod = " + quote(edited), "source_id = " + quote(pid), "source_url = " + quote("https://glowing-stetson-562.notion.site/" + pid.replace("-", ""))]
            if meta:
                slug, category, visual, summary, tags = meta
                frontmatter.extend(["description = " + quote(summary), "summary = " + quote(summary), "eyebrow = " + quote(category), "visual = " + quote(visual), "tags = " + quote(tags), "weight = " + str((project_ids.index(pid) + 1) * 10 if pid in project_ids else 100), "portfolio = " + ("true" if pid in project_ids else "false")])
                if pid not in project_ids:
                    parent = self.parents[pid]
                    frontmatter.extend(["series_parent = " + quote(self.routes[parent]), "series_title = " + quote(clean_title(title(self.pages[parent]["blocks"][parent])) )])
            else:
                frontmatter.extend(["description = \"Nicole Chen 的工作经历、教育背景与专业技能。\"", "showTableOfContents = true"])
            frontmatter.extend(["+++", ""])
            content = self.blocks(page_block.get("content", []), page)
            content = "\n".join(line.rstrip() for line in content.splitlines()).rstrip() + "\n"
            if "mailto:ada@yourdomain.com" in content:
                raise RuntimeError("Template email leaked into the export")
            output_path.write_text("\n".join(frontmatter) + "\n" + content, encoding="utf-8")
            expected = {b["id"] for b in descendants(page)}
            missing = expected - self.converted
            if missing:
                raise RuntimeError("Unconverted blocks: " + str(missing))
            report.append({"title": name, "path": output_path.relative_to(ROOT).as_posix(), "source_id": pid, "blocks": len(expected), "characters": len(content)})
        (ROOT / "data").mkdir(exist_ok=True)
        media_inventory = [{"path": item["path"], "bytes": (ROOT / "static" / item["path"].lstrip("/")).stat().st_size} for item in self.manifest["media"] if "error" not in item]
        (ROOT / "data" / "migration.json").write_text(json.dumps({"imported_on": "2026-11-01", "pages": report, "media_count": len(self.manifest["media"]), "media": media_inventory, "media_errors": sum("error" in item for item in self.manifest["media"])}, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps({"pages": len(report), "blocks": len(self.converted), "media": len(self.media)}, ensure_ascii=False))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    Exporter().run()
