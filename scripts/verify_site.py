"""Check built HTML links, anchors, images, migration inventory, and Pages paths.

Uses only Python's standard library. Does not make network requests.
"""

import argparse
from html.parser import HTMLParser
import json
from pathlib import Path
import sys
from urllib.parse import unquote, urljoin, urlparse


class Document(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.ids = set()
        self.links = []
        self.headings = 0
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        if attributes.get("id"):
            self.ids.add(attributes["id"])
        if tag == "h1":
            self.headings += 1
        for attribute in ("href", "src"):
            if attributes.get(attribute):
                self.links.append(attributes[attribute])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--public", default="public")
    parser.add_argument("--base-url", default="https://zhiyingchen.github.io/")
    args = parser.parse_args()
    public = Path(args.public).resolve()
    base = urlparse(args.base_url)
    prefix = base.path.rstrip("/") + "/"
    documents = {path: Document(path) for path in public.rglob("*.html")}
    failures = []
    references = 0
    for path, document in documents.items():
        relative = path.relative_to(public).as_posix()
        page_url = urljoin(args.base_url.rstrip("/") + "/", relative.removesuffix("index.html"))
        if document.headings != 1:
            failures.append(f"{relative}: expected one h1, found {document.headings}")
        for link in document.links:
            if link.startswith(("mailto:", "tel:", "data:", "javascript:")):
                continue
            target = urlparse(urljoin(page_url, link))
            if target.netloc != base.netloc:
                continue
            decoded_path = unquote(target.path)
            if not decoded_path.startswith(prefix):
                failures.append(f"{relative}: URL escapes Pages subpath: {link}")
                continue
            suffix = decoded_path[len(prefix):]
            destination = (public / suffix).resolve()
            if not destination.is_relative_to(public):
                failures.append(f"{relative}: URL escapes the build directory: {link}")
                continue
            if destination.is_dir():
                destination /= "index.html"
            references += 1
            if not destination.is_file():
                failures.append(f"{relative}: missing target: {link}")
                continue
            if target.fragment and destination in documents and unquote(target.fragment) not in documents[destination].ids:
                failures.append(f"{relative}: missing anchor: {link}")
        if "attachment:" in path.read_text(encoding="utf-8"):
            failures.append(f"{relative}: unresolved Notion attachment")
    inventory_path = Path(__file__).resolve().parents[1] / "data" / "migration.json"
    inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
    for item in inventory["pages"]:
        route = item["path"].removeprefix("content/").removesuffix(".md")
        if not (public / route / "index.html").is_file():
            failures.append("Missing migrated page: " + route)
    if inventory["media_errors"]:
        failures.append("The migration inventory reports media errors")
    for item in inventory.get("media", []):
        destination = public / item["path"].lstrip("/")
        if not destination.is_file() or destination.stat().st_size != item["bytes"]:
            failures.append("Missing or truncated migrated media: " + item["path"])
    print(json.dumps({"html_pages": len(documents), "local_references": references, "migrated_pages": len(inventory["pages"]), "media_files": inventory["media_count"], "errors": failures}, ensure_ascii=False, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    raise SystemExit(main())
