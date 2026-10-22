#!/usr/bin/env python3
"""Enlarges the map picture 2x with the EDSR super-resolution model (OpenCV's dnn_superres).

    python3 tools/upscale-map.py <source.png> <out.png> [workers] [EDSR_x2.pb]

Setup: pip install opencv-contrib-python numpy, and download the model (38 MB, not kept in the repository):
    https://raw.githubusercontent.com/Saafke/EDSR_Tensorflow/master/models/EDSR_x2.pb
It works in 128 px tiles with a 12 px margin so the seams do not show, and skips tiles that are only black
(plain interpolation there). It takes about 10 to 20 minutes on two CPU cores for the 1542 x 1080 map.

Why a model and not just resizing: on a test (the map shrunk 2x, then enlarged back) EDSR came within
24.3 dB of the real picture where bicubic and Lanczos reached 22.2 and 22.1 dB. It still only guesses the detail
that was lost, so the result is a cleaner enlargement, not a new picture. The result is img/map/pharloom-map.png;
tools/make-map.py cuts the Region pictures from it.
"""
import sys
import time
from multiprocessing import Pool

import cv2
import numpy as np

TILE, PAD = 128, 12
MODEL = 'EDSR_x2.pb'
_state = {}


def init(model):
    cv2.setNumThreads(1)  # one thread per worker: the workers are the parallelism
    sr = cv2.dnn_superres.DnnSuperResImpl_create()
    sr.readModel(model)
    sr.setModel('edsr', 2)
    _state['sr'] = sr


def work(job):
    (y, x), tile, rows, cols = job
    if tile.max() < 28:  # nothing but background
        up = cv2.resize(tile, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    else:
        up = _state['sr'].upsample(tile)
    return (y, x), up[2 * PAD:2 * PAD + 2 * rows, 2 * PAD:2 * PAD + 2 * cols]


def main():
    source, target = sys.argv[1], sys.argv[2]
    workers = int(sys.argv[3]) if len(sys.argv) > 3 else 2
    model = sys.argv[4] if len(sys.argv) > 4 else MODEL
    img = cv2.imread(source)
    height, width = img.shape[:2]
    padded = cv2.copyMakeBorder(img, PAD, PAD, PAD, PAD, cv2.BORDER_REFLECT)
    jobs = [((y, x), padded[y:y + TILE + 2 * PAD, x:x + TILE + 2 * PAD], min(TILE, height - y), min(TILE, width - x))
            for y in range(0, height, TILE) for x in range(0, width, TILE)]
    out = np.zeros((2 * height, 2 * width, 3), np.uint8)
    start = time.time()
    with Pool(workers, initializer=init, initargs=(model,)) as pool:
        for i, ((y, x), up) in enumerate(pool.imap_unordered(work, jobs)):
            out[2 * y:2 * y + up.shape[0], 2 * x:2 * x + up.shape[1]] = up
            if i % 10 == 0:
                print(f'{i}/{len(jobs)} tiles, {time.time() - start:.0f}s', flush=True)
    cv2.imwrite(target, out)
    print('done', out.shape, f'{time.time() - start:.0f}s')


if __name__ == '__main__':
    main()
