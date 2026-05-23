import pytest

@pytest.mark.asyncio
async def test_federation_status(client):
    response = await client.get("/api/federation/status")
    assert response.status_code == 200
    data = response.json()
    assert "federation" in data

@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data

@pytest.mark.asyncio
async def test_vue_client_complet(client):
    response = await client.get("/api/clients?page_size=1")
    assert response.status_code == 200
    data = response.json()
    assert "clients" in data

@pytest.mark.asyncio
async def test_vue_tableau_bord(client):
    response = await client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "indicateurs_par_agence" in data
