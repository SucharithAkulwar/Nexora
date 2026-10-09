import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db


@pytest.mark.asyncio
async def test_kolhapur_hospital_discovery():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/hospitals/")
        assert res.status_code == 200
        data = res.json()
        assert "hospitals" in data
        assert len(data["hospitals"]) >= 5
        
        # Verify real Kolhapur facilities are returned
        hosp_names = [h["name"] for h in data["hospitals"]]
        assert any("CPR" in name or "Chhatrapati Pramila Raje" in name for name in hosp_names)
        assert any("Aster Aadhar" in name for name in hosp_names)


@pytest.mark.asyncio
async def test_kolhapur_locality_filter():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/hospitals/?locality=Shahupuri")
        assert res.status_code == 200
        data = res.json()
        assert len(data["hospitals"]) >= 1
        for h in data["hospitals"]:
            assert "Shahupuri" in h["locality"] or "Shahupuri" in h["formatted_address"]


@pytest.mark.asyncio
async def test_hospital_detail_with_reviews():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/hospitals/hosp-cpr-kolhapur")
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == "hosp-cpr-kolhapur"
        assert "reviews" in data
        assert len(data["reviews"]) > 0
        assert data["rating"] > 0
