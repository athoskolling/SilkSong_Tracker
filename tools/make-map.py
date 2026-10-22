#!/usr/bin/env python3
"""Cuts one picture per Region out of the full map and writes data/map.json.

    python3 tools/make-map.py

Reads   img/map/pharloom-map.png   the full map (made by tools/upscale-map.py)
        tools/map-boxes.json       where each Region is, in pixels of that picture
        data/regions.json          the Region ids and the dataVersion to stamp
Writes  img/map/regions/<region-id>.png   one picture per Region
        data/map.json                     what the Map page reads (docs/MAP-PROPOSAL.md)

data/map.json is written by this script, so change tools/map-boxes.json and run it again instead of editing
the JSON. Needs Pillow only. The map art is Team Cherry's (see docs/IMAGES.md).
"""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FULL = 'img/map/pharloom-map.png'
CREDIT = ('Map art © Team Cherry, from Hollow Knight: Silksong. Stitched picture by Brent (Steam community). '
          'Enlarged 2x for this guide with an upscaling model, so fine detail is a best guess.')

def main():
    version = json.loads((ROOT / 'data/regions.json').read_text())['dataVersion']
    regions = [r['id'] for r in sorted(json.loads((ROOT / 'data/regions.json').read_text())['regions'], key=lambda r: r['order'])]
    boxes = json.loads((ROOT / 'tools/map-boxes.json').read_text())['boxes']
    full = Image.open(ROOT / FULL).convert('RGB')
    (ROOT / 'img/map/regions').mkdir(parents=True, exist_ok=True)
    entries = []
    for region_id in regions:
        if region_id not in boxes:
            print('no box for', region_id, '(skipped)')
            continue
        left, top, right, bottom = boxes[region_id]
        crop = full.crop((left, top, right, bottom))
        crop.save(ROOT / f'img/map/regions/{region_id}.png', optimize=True)
        entries.append({'regionId': region_id, 'image': f'img/map/regions/{region_id}.png',
                        'width': crop.width, 'height': crop.height, 'box': [left, top, right, bottom]})
    doc = {
        'dataVersion': version,
        'full': {'image': FULL, 'width': full.width, 'height': full.height,
                 'alt': 'Map of the whole of Pharloom from Hollow Knight: Silksong. Every Region is drawn in its own colour, with its name beside it.',
                 'credit': CREDIT},
        'regions': entries,
    }
    (ROOT / 'data/map.json').write_text(json.dumps(doc, indent=1) + '\n')
    print(f'{len(entries)} Region pictures and data/map.json written (dataVersion {version})')

if __name__ == '__main__':
    main()
