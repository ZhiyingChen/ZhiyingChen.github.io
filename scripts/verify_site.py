"""Check built HTML links, anchors, images, migration inventory, and Pages paths.

Uses only Python's standard library. Does not make network requests.
"""

import argparse
from html.parser import HTMLParser
import json
import re
from pathlib import Path
import sys
from urllib.parse import unquote, urljoin, urlparse


class Document(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.ids = set()
        self.links = []
        self.headings = 0
        self.language = None
        self.canonical = None
        self.redirect = False
        self.alternates = {}
        self.language_links = []
        self.page_links = []
        self.search_base = None
        self.text = []
        self.skip_text = False
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        if tag == "html":
            self.language = attributes.get("lang")
        if tag in ("script", "style"):
            self.skip_text = True
        if tag == "meta" and attributes.get("http-equiv", "").lower() == "refresh":
            self.redirect = True
        if tag == "link" and attributes.get("rel") == "canonical":
            self.canonical = attributes.get("href")
        if tag == "link" and attributes.get("rel") == "alternate" and attributes.get("hreflang"):
            self.alternates[attributes["hreflang"]] = attributes.get("href")
        if tag == "a" and attributes.get("hreflang"):
            self.language_links.append(attributes)
        elif tag == "a" and attributes.get("href"):
            self.page_links.append(attributes["href"])
        if attributes.get("id") == "search-wrapper":
            self.search_base = attributes.get("data-url")
        if attributes.get("id"):
            self.ids.add(attributes["id"])
        if tag == "h1":
            self.headings += 1
        for attribute in ("href", "src"):
            if attributes.get(attribute):
                self.links.append(attributes[attribute])

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.skip_text = False

    def handle_data(self, text):
        if not self.skip_text:
            self.text.append(text)


def check_translations(public, documents, base_url, failures):
    root = Path(__file__).resolve().parents[1]
    prefix = urlparse(base_url).path.rstrip("/") + "/"
    pairs = 0
    for source in sorted((root / "content").rglob("*.md")):
        if source.name.endswith(".en.md"):
            continue
        english = source.with_name(source.stem + ".en.md")
        if not english.is_file():
            failures.append(f"Missing English source: {english.relative_to(root)}")
        route = source.relative_to(root / "content").with_suffix("").as_posix()
        if route.endswith("_index"):
            route = route.removesuffix("_index")
        else:
            route += "/"
        paths = {"zh-CN": prefix + route, "en-US": prefix + "en/" + route}
        for locale, page_path in paths.items():
            relative = page_path[len(prefix):] + "index.html"
            document = documents.get(public / relative)
            if document is None:
                failures.append(f"Missing translated page: {relative}")
                continue
            expected_lang = "en" if locale == "en-US" else "zh-CN"
            if document.language != expected_lang:
                failures.append(f"{relative}: incorrect HTML language")
            if document.canonical != urljoin(base_url, page_path):
                failures.append(f"{relative}: incorrect canonical URL")
            for target_locale, target_path in paths.items():
                if document.alternates.get(target_locale) != urljoin(base_url, target_path):
                    failures.append(f"{relative}: incorrect {target_locale} alternate")
                switches = [link for link in document.language_links if link.get("hreflang") == target_locale]
                if not switches or any(link["href"] != target_path for link in switches):
                    failures.append(f"{relative}: incorrect {target_locale} language switch")
                if any((link.get("aria-current") == "true") != (target_locale == locale) for link in switches):
                    failures.append(f"{relative}: incorrect active language")
            expected_search = prefix + ("en/" if locale == "en-US" else "")
            if document.search_base != expected_search:
                failures.append(f"{relative}: incorrect search index URL")
            if locale == "en-US":
                chinese = [text.strip() for text in document.text if re.search(r"[\u4e00-\u9fff]", text) and text.strip() != "中"]
                if chinese:
                    failures.append(f"{relative}: untranslated text: {chinese[:3]}")
            for link in document.page_links:
                target = urlparse(urljoin(document.canonical, link))
                if target.netloc != urlparse(base_url).netloc or not target.path.startswith(prefix):
                    continue
                suffix = target.path[len(prefix):]
                target_file = public / suffix / "index.html"
                if target_file in documents and not documents[target_file].redirect:
                    if suffix.startswith("en/") != (locale == "en-US"):
                        failures.append(f"{relative}: link leaves current language: {link}")
        pairs += 1
    for language in ("", "en/"):
        index_path = public / language / "index.json"
        if not index_path.is_file():
            failures.append(f"Missing search index: {language}index.json")
            continue
        index = json.loads(index_path.read_text(encoding="utf-8"))
        expected = {prefix + language + source.relative_to(root / "content").with_suffix("").as_posix() + "/"
                    for source in (root / "content").rglob("*.md")
                    if not source.name.endswith(".en.md") and source.stem != "_index"}
        actual = {item["permalink"] for item in index}
        if actual != expected:
            failures.append(f"{language}index.json: missing, extra, or mixed-language search results")
    return pairs


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
        if not document.redirect and document.headings != 1:
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
    translated_pairs = check_translations(public, documents, args.base_url, failures)
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
    print(json.dumps({"html_pages": len(documents), "translated_pairs": translated_pairs, "local_references": references, "migrated_pages": len(inventory["pages"]), "media_files": inventory["media_count"], "errors": failures}, ensure_ascii=False, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    raise SystemExit(main())
