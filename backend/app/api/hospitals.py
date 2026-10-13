from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from app.services.google_places import places_service
from app.core.database import get_db

router = APIRouter()


@router.get("/")
async def discover_hospitals(
    lat: float = Query(16.7050, description="Latitude for nearby search"),
    lng: float = Query(74.2433, description="Longitude for nearby search"),
    radius: float = Query(15000, description="Radius in meters"),
    locality: Optional[str] = Query(None, description="Locality within Kolhapur"),
    query: Optional[str] = Query(None, description="Search term for name or facility type"),
    sort_by: str = Query("rating", pattern="^(rating|distance)$", description="Sort by rating or distance")
):
    """
    Kolhapur Hospital Discovery endpoint.
    Retrieves live Google Maps Platform Places listings when API key is configured,
    or returns verified Kolhapur medical directory.
    Cross-references with Nexora MongoDB for bookable doctor availability.
    """
    result = await places_service.search_nearby_hospitals(
        lat=lat,
        lng=lng,
        radius_meters=radius,
        locality=locality,
        query=query,
        sort_by=sort_by
    )

    db = get_db()
    hospitals = result["hospitals"]

    # Annotate hospitals with participating Nexora doctors
    for hosp in hospitals:
        doc_count = await db["doctor_profiles"].count_documents({"hospital_id": hosp["id"]})
        hosp["has_nexora_doctors"] = doc_count > 0
        hosp["bookable_doctors_count"] = doc_count

    return result


@router.get("/localities")
async def list_kolhapur_localities():
    """List prominent healthcare localities in Kolhapur for filtering."""
    return [
        {"name": "All Localities", "value": ""},
        {"name": "Mangalwar Peth (CPR Hospital Area)", "value": "Mangalwar Peth"},
        {"name": "Shastri Nagar (Aster Aadhar Area)", "value": "Shastri Nagar"},
        {"name": "Kadamwadi (Apple Saraswati Area)", "value": "Kadamwadi"},
        {"name": "Shahupuri (Station Road)", "value": "Shahupuri"},
        {"name": "Tarabai Park", "value": "Tarabai Park"},
        {"name": "Rajarampuri", "value": "Rajarampuri"},
        {"name": "Line Bazaar / Kasaba Bawada (DY Patil Area)", "value": "Line Bazaar"}
    ]


@router.get("/{hospital_id}")
async def get_hospital_details(hospital_id: str):
    """Retrieve detailed hospital profile, Google reviews, and participating Nexora doctors."""
    details = await places_service.get_hospital_details(hospital_id)
    if not details:
        raise HTTPException(status_code=404, detail="Hospital not found")

    db = get_db()
    # Fetch doctors affiliated with this hospital in Nexora
    cursor = db["doctor_profiles"].find({"hospital_id": hospital_id})
    doctors = await cursor.to_list(length=20)

    if len(doctors) == 0:
        attending = await db["doctor_profiles"].find_one({
            "$or": [{"user_id": "attending-consultant"}, {"_id": "profile-attending-consultant"}]
        })
        if attending:
            duty_doc = dict(attending)
            duty_doc["hospital_id"] = hospital_id
            doctors = [duty_doc]

    details["has_nexora_doctors"] = len(doctors) > 0
    details["bookable_doctors_count"] = len(doctors)
    details["participating_doctors"] = doctors

    return details
