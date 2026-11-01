"""Read a public Notion site and archive its published pages and media locally.

Usage: python scripts/import_notion.py
Raw responses stay in .migration/ (ignored by Git). No login is required.
"""

from __future__ import annotations

import concurrent.futures
import json
from pathlib import Path
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / ".migration"
BASE = "https://glowing-stetson-562.notion.site"
HOME_ID = "205891a4-bd54-8051-bc2f-c5b64241d12a"
SPACE_ID = "9df891a4-bd54-8108-ae3f-0003eeb35274"
COLLECTION_ID = "206891a4-bd54-8049-bea5-000bedf54be6"
VIEW_ID = "206891a4-bd54-80be-ab73-000c3e7c47d3"
COLLECTION_BLOCK_ID = "206891a4-bd54-8021-b162-e432136c1d2f"


def request(url: str, payload: dict | None = None) -> bytes:
    url = urllib.parse.quote(url, safe=":/?&=%+#@;,$!()*[]~")
    headers = {"User-Agent": "Mozilla/5.0", "Origin": BASE, "Referer": BASE + "/" + HOME_ID.replace("-", "")}
    body = None
    if payload is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(payload).encode("utf-8")
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, data=body, headers=headers), timeout=45) as response:
                return response.read()
        except (urllib.error.URLError, TimeoutError):
            if attempt == 2:
                raise
            time.sleep(attempt + 1)
    raise RuntimeError("Request failed")


def api(method: str, payload: dict) -> dict:
    return json.loads(request(BASE + "/api/v3/" + method, payload))


def unwrap(record: dict) -> dict:
    value = record.get("value", {})
    return value.get("value", value)


def title(block: dict) -> str:
    return "".join(str(item[0]) for item in block.get("properties", {}).get("title", []) if item)


def read_page(page_id: str) -> tuple[str, dict]:
    path = ARCHIVE / "pages" / (page_id + ".json")
    if path.exists():
        return page_id, json.loads(path.read_text(encoding="utf-8"))
    cursor: dict = {"stack": []}
    blocks: dict = {}
    records: dict = {}
    for chunk in range(200):
        data = api("loadPageChunk", {"pageId": page_id, "limit": 100, "cursor": cursor, "chunkNumber": chunk, "verticalColumns": False})
        for table, entries in data.get("recordMap", {}).items():
            if isinstance(entries, dict):
                records.setdefault(table, {}).update(entries)
        blocks.update({key: unwrap(value) for key, value in data.get("recordMap", {}).get("block", {}).items()})
        cursor = data.get("cursor", {"stack": []})
        if not cursor.get("stack"):
            break
    else:
        raise RuntimeError("Page pagination exceeded its limit: " + page_id)
    if page_id not in blocks:
        raise RuntimeError("Public page is unavailable: " + page_id)
    result = {"page_id": page_id, "blocks": blocks, "records": records}
    path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Read", title(blocks[page_id]), "—", len(blocks), "blocks", flush=True)
    return page_id, result


def descendants(page: dict):
    blocks = page["blocks"]
    visited: set[str] = set()

    def walk(block_id: str):
        if block_id in visited or block_id not in blocks:
            return
        visited.add(block_id)
        block = blocks[block_id]
        yield block
        if block_id != page["page_id"] and block.get("type") == "page":
            return
        for child in block.get("content", []):
            yield from walk(child)

    yield from walk(page["page_id"])


def media_sources(pages: dict):
    seen = set()
    for page in pages.values():
        for block in descendants(page):
            fmt = block.get("format", {})
            sources = []
            if block.get("type") in ("image", "file", "pdf", "video", "audio"):
                sources.extend(item[0] for item in block.get("properties", {}).get("source", []) if item)
            if fmt.get("page_cover"):
                sources.append(fmt["page_cover"])
            icon = fmt.get("page_icon", "")
            if icon.startswith(("https://", "attachment:")):
                sources.append(icon)
            for source in sources:
                key = (block["id"], source)
                if key not in seen:
                    seen.add(key)
                    yield {"block_id": block["id"], "type": block.get("type"), "source": source, "title": title(block)}


def download_media(item: dict) -> dict:
    source = item["source"]
    name = urllib.parse.unquote(source.rsplit(":", 1)[-1] if source.startswith("attachment:") else urllib.parse.urlparse(source).path.rsplit("/", 1)[-1])
    extension = Path(name).suffix.lower()
    if not extension or len(extension) > 8:
        extension = ".png" if item["type"] == "image" else ".bin"
    fingerprint = __import__("hashlib").sha256(source.encode()).hexdigest()[:10]
    relative = "media/" + item["block_id"][:8] + "-" + fingerprint + extension
    target = ROOT / "static" / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    result = {**item, "path": "/" + relative, "filename": name}
    if target.exists() and target.stat().st_size:
        return result
    try:
        if source.startswith("attachment:") or "secure.notion-static.com" in source or "file.notion.so" in source or "prod-files-secure" in source:
            signed = api("getSignedFileUrls", {"urls": [{"url": source, "permissionRecord": {"table": "block", "id": item["block_id"]}}]})
            urls = signed.get("signedUrls", [])
            if not urls or not urls[0]:
                raise RuntimeError("No signed download URL returned")
            download_url = urls[0]
        else:
            download_url = urllib.parse.urljoin(BASE, source)
        content = request(download_url)
        if content[:15].lower().startswith((b"<!doctype html", b"<html")):
            raise RuntimeError("Media response was HTML")
        target.write_bytes(content)
        result["bytes"] = len(content)
        print("Media", name, len(content), "bytes", flush=True)
    except Exception as exc:
        result["error"] = str(exc)
        print("MEDIA FAILED", name, str(exc), flush=True)
    return result


def main():
    (ARCHIVE / "pages").mkdir(parents=True, exist_ok=True)
    collections = {}

    def read_collection(block_id, collection_id, view_id):
        path = ARCHIVE / ("collection-" + block_id + ".json")
        if path.exists():
            query = json.loads(path.read_text(encoding="utf-8"))
        else:
            query = api("queryCollection", {"collectionId": collection_id, "collectionViewId": view_id, "source": {"type": "collection", "id": block_id, "spaceId": SPACE_ID}, "loader": {"type": "reducer", "reducers": {"collection_group_results": {"type": "results", "limit": 100}}, "searchQuery": "", "userTimeZone": "Asia/Shanghai"}, "query": {}})
            path.write_text(json.dumps(query, ensure_ascii=False, indent=2), encoding="utf-8")
        listing = query["result"]["reducerResults"]["collection_group_results"]
        if listing.get("hasMore"):
            raise RuntimeError("The collection exceeds the supported 100-page limit; paginate it before proceeding.")
        collections[block_id] = listing["blockIds"]
        return listing["blockIds"]

    project_ids = read_collection(COLLECTION_BLOCK_ID, COLLECTION_ID, VIEW_ID)
    ids = [HOME_ID, *project_ids]
    pages: dict = {}
    while ids:
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            for page_id, data in pool.map(read_page, ids):
                pages[page_id] = data
        pending = []
        for page in pages.values():
            for block in descendants(page):
                if block.get("type") == "page" and block["id"] not in pages:
                    pending.append(block["id"])
                if block.get("type") in ("collection_view", "collection_view_page") and block["id"] not in collections:
                    pending.extend(read_collection(block["id"], block["collection_id"], block["view_ids"][0]))
        ids = [pid for pid in dict.fromkeys(pending) if pid not in pages]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        media = list(pool.map(download_media, media_sources(pages)))
    summary = {"home_id": HOME_ID, "project_ids": project_ids, "collections": collections, "pages": [{"id": pid, "title": title(page["blocks"][pid]), "blocks": len(list(descendants(page)))} for pid, page in pages.items()], "media": media, "block_types": dict(Counter(block.get("type") for page in pages.values() for block in descendants(page)))}
    (ARCHIVE / "manifest.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"pages": len(pages), "media": len(media), "media_errors": sum("error" in item for item in media), "types": summary["block_types"]}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
