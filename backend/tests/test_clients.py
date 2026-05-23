import pytest
from app.main import app

@pytest.mark.asyncio
async def test_list_clients(client):
    response = await client.get("/api/clients?page_size=5")
    assert response.status_code == 200
    data = response.json()
    assert "clients" in data
    assert isinstance(data["clients"], list)

@pytest.mark.asyncio
async def test_list_clients_with_search(client):
    response = await client.get("/api/clients?search=Mensah")
    assert response.status_code == 200
    data = response.json()
    assert "clients" in data

@pytest.mark.asyncio
async def test_get_client_not_found(client):
    response = await client.get("/api/clients/icf_inexistant_1234567890123456789012345678901234567890123456789012345678")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_create_client(client):
    client_data = {
        "nom": "Test",
        "prenom": "Client",
        "date_naissance": "1990-01-01",
        "numero_piece": "CNI-TEST-001",
        "telephone": "90000000",
        "id_agence": 1
    }
    response = await client.post("/api/clients", json=client_data)
    assert response.status_code == 201
    data = response.json()
    assert "icf" in data
