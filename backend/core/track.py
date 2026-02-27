import time
from functools import wraps


def track(func):
    count = 0

    @wraps(func)
    def wrapper(*args, **kwargs):
        nonlocal count
        start = time.time()
        result = func(*args, **kwargs)
        count += 1
        elapsed = (time.time() - start) * 1000
        print(f"调用第 {count} 次，用时 {elapsed:.2f} ms")
        return result

    return wrapper


@track
def func():
    print("hello fox")


func()
func()
