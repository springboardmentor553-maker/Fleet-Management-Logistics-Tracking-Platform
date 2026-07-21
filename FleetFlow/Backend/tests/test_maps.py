from app.services.maps import geocode_location


def test_geocode_location_returns_known_city_coordinates():
    result = geocode_location('Chennai')
    assert result['latitude'] == 13.0827
    assert result['longitude'] == 80.2707


def test_geocode_location_returns_stable_coordinates_for_unknown_place():
    result = geocode_location('Somewhere Else')
    assert result['latitude'] is not None
    assert result['longitude'] is not None
