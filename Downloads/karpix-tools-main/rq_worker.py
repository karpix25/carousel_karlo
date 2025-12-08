#!/usr/bin/env python3

import redis
from rq import Connection, Worker

from config import REDIS_URL, RQ_QUEUE_NAME


def main():
    redis_conn = redis.from_url(REDIS_URL)
    with Connection(redis_conn):
        worker = Worker([RQ_QUEUE_NAME])
        worker.work()


if __name__ == "__main__":
    main()
