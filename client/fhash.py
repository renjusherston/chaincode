import hashlib
import sys

target = sys.argv[1]

hasher = hashlib.md5()
with open(target, 'rb') as afile:
    buf = afile.read()
    hasher.update(buf)

print(hasher.hexdigest())
