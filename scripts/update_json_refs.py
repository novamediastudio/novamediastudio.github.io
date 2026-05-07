#!/usr/bin/env python3
"""
Step 2: Update projects.json to use .webp paths.

For every image src that ends in .jpg / .jpeg / .png, this script checks
whether the corresponding .webp file exists on disk. If it does, it rewrites
the src. If not, it leaves the original path untouched and prints a warning.

Run from the root of novamediastudio.github.io:
    python3 update_json_refs.py
"""

import json
import os
import re

JSON_PATH = "js/projects.json"
IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png")


def find_and_replace_srcs(obj, changed, warnings):
    """Recursively walk the JSON structure and patch src fields."""
    if isinstance(obj, dict):
        for key, value in obj.items():
            if key == "src" and isinstance(value, str):
                lower = value.lower()
                if any(lower.endswith(ext) for ext in IMAGE_EXTENSIONS):
                    webp_path = re.sub(r"\.[^.]+$", ".webp", value, flags=re.IGNORECASE)
                    if os.path.isfile(webp_path):
                        obj[key] = webp_path
                        changed.append(f"  ✓  {value}  →  {webp_path}")
                    else:
                        warnings.append(f"  ⚠  WebP not found, keeping original: {value}")
            else:
                find_and_replace_srcs(value, changed, warnings)
    elif isinstance(obj, list):
        for item in obj:
            find_and_replace_srcs(item, changed, warnings)


def main():
    if not os.path.isfile(JSON_PATH):
        print(f"ERROR: {JSON_PATH} not found. Run from the repo root.")
        return

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    changed = []
    warnings = []
    find_and_replace_srcs(data, changed, warnings)

    if not changed and not warnings:
        print("No image src fields found — nothing to update.")
        return

    if changed:
        print(f"Updated {len(changed)} src reference(s):")
        for line in changed:
            print(line)

    if warnings:
        print(f"\nSkipped {len(warnings)} reference(s) — WebP file not found yet:")
        for line in warnings:
            print(line)
        print("\nRun convert_to_webp.sh first to generate the missing WebP files,")
        print("then re-run this script.")

    if changed:
        # Write back with consistent formatting
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
            f.write("\n")
        print(f"\n✓ {JSON_PATH} saved.")
    else:
        print("\nNo changes written (all WebP files missing).")


if __name__ == "__main__":
    main()
