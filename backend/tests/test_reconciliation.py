import pytest

@pytest.mark.asyncio
async def test_icf_coherence(client):
    response = await client.get("/api/clients?page_size=1")
    assert response.status_code == 200
    data = response.json()
    if data["clients"]:
        icf = data["clients"][0]["icf"]
        response = await client.get(f"/api/clients/{icf}")
        assert response.status_code == 200
