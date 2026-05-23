import pytest

@pytest.mark.asyncio
async def test_list_credits(client):
    response = await client.get("/api/credits?page_size=5")
    assert response.status_code == 200
    data = response.json()
    assert "credits" in data

@pytest.mark.asyncio
async def test_list_credits_by_statut(client):
    response = await client.get("/api/credits?statut=approuve")
    assert response.status_code == 200
    data = response.json()
    for credit in data["credits"]:
        assert credit["statut_credit"] == "approuve"

@pytest.mark.asyncio
async def test_get_credit_by_id(client):
    response = await client.get("/api/credits/1")
    assert response.status_code in [200, 404]
