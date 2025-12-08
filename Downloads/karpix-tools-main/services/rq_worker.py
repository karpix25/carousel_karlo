# Copyright (c) 2025 Stephen G. Pope
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along
# with this program; if not, write to the Free Software Foundation, Inc.,
# 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.


import importlib
import os
import time
from typing import Any, Dict, Tuple

from rq import get_current_job

from app_utils import log_job_status
from services.webhook import send_webhook
from version import BUILD_NUMBER


def _resolve_callable(module_name: str, qualname: str):
    """
    Resolve a function from its module and qualname so it can be invoked inside the worker.
    """
    module = importlib.import_module(module_name)
    attr = module
    for part in qualname.split('.'):
        attr = getattr(attr, part)
    return attr


def run_queued_task(
    module_name: str,
    qualname: str,
    job_id: str,
    data: Dict[str, Any],
    call_args: Tuple[Any, ...],
    call_kwargs: Dict[str, Any],
):
    """
    Execute a queued route handler using Redis Queue context.
    """
    job = get_current_job()
    queue_id = job.origin if job else "rq"
    pid = os.getpid()
    start_time = time.time()
    enqueue_ts = job.enqueued_at.timestamp() if job and job.enqueued_at else start_time
    queue_time = start_time - enqueue_ts

    log_job_status(job_id, {
        "job_status": "running",
        "job_id": job_id,
        "queue_id": queue_id,
        "process_id": pid,
        "response": None
    })

    try:
        handler = _resolve_callable(module_name, qualname)
        response = handler(job_id=job_id, data=data, *call_args, **call_kwargs)
        run_time = time.time() - start_time
        total_time = time.time() - enqueue_ts

        queue_length = job.get_queue().count if job else 0

        response_data = {
            "endpoint": response[1],
            "code": response[2],
            "id": data.get("id"),
            "job_id": job_id,
            "response": response[0] if response[2] == 200 else None,
            "message": "success" if response[2] == 200 else response[0],
            "pid": pid,
            "queue_id": queue_id,
            "run_time": round(run_time, 3),
            "queue_time": round(queue_time, 3),
            "total_time": round(total_time, 3),
            "queue_length": queue_length,
            "build_number": BUILD_NUMBER
        }

        log_job_status(job_id, {
            "job_status": "done",
            "job_id": job_id,
            "queue_id": queue_id,
            "process_id": pid,
            "response": response_data
        })

        if data.get("webhook_url"):
            send_webhook(data.get("webhook_url"), response_data)

        return response_data

    except Exception as exc:

        error_response = {
            "code": 500,
            "id": data.get("id"),
            "job_id": job_id,
            "message": str(exc),
            "pid": pid,
            "queue_id": queue_id,
            "build_number": BUILD_NUMBER
        }

        log_job_status(job_id, {
            "job_status": "failed",
            "job_id": job_id,
            "queue_id": queue_id,
            "process_id": pid,
            "response": error_response
        })

        if data.get("webhook_url"):
            send_webhook(data.get("webhook_url"), error_response)

        raise
