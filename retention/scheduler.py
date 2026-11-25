import threading

from retention import sweep
from retention.settings import RetentionSettings

FIRST_CHECK_SECONDS = 60
CHECK_EVERY_SECONDS = 3600


class RetentionScheduler:
    """Looks once an hour whether the day's run is due and runs it (retention/sweep.py).

    Every gunicorn worker has one; the advisory lock lets one run at a time, and the due
    check under the lock lets the day's run happen once. Nothing starts while the mode is off.
    """

    def __init__(self, engine, settings: RetentionSettings):
        self._engine = engine
        self._settings = settings
        self._stop = threading.Event()
        self._thread = None

    def start(self) -> None:
        if self._settings.mode == "off" or self._thread is not None:
            return
        self._thread = threading.Thread(target=self._loop, name="retention-sweep", daemon=True)
        self._thread.start()

    @property
    def running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def stop(self) -> None:
        self._stop.set()

    def _loop(self) -> None:
        if self._stop.wait(FIRST_CHECK_SECONDS):
            return
        while True:
            self.check()
            if self._stop.wait(CHECK_EVERY_SECONDS):
                return

    def check(self) -> None:
        try:
            sweep.run(self._engine, self._settings, "schedule")
        except Exception as exc:  # noqa: BLE001  (tried again in an hour)
            sweep.log.warning("retention_sweep check failed code=%s", sweep.error_code(exc))
