import os

os.environ["PATCHPILOT_DEMO_DELAY"] = "0"
os.environ["DEMO_MODE"] = "true"

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client
