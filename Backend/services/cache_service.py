import time

cache = {}

def set_cache(key, data, ttl):
    cache[key] = {
        "data": data,
        "expiry": time.time() + ttl
    }

def get_cache(key):
    if key in cache:
        if time.time() < cache[key]["expiry"]:
            return cache[key]["data"]
        else:
            del cache[key]
    return None