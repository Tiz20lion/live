from pydantic import BaseModel, validator, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class FieldType(str, Enum):
    # Personal & Contact Fields
    NAME = "name"
    EMAIL = "email"
    PHONE = "phone"
    MOBILE = "mobile"
    
    # Professional Fields
    COMPANY = "company"
    TITLE = "title"
    DEPARTMENT = "department"
    SENIORITY = "seniority"
    INDUSTRY = "industry"
    COMPANY_SIZE = "company_size"
    REVENUE = "revenue"
    
    # Location Fields
    LOCATION = "location"
    CITY = "city"
    STATE = "state"
    COUNTRY = "country"
    TIMEZONE = "timezone"
    
    # Social Media Fields
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    INSTAGRAM = "instagram"
    FACEBOOK = "facebook"
    WEBSITE = "website"
    
    # Additional Professional Data
    EXPERIENCE_YEARS = "experience_years"
    EDUCATION = "education"
    SKILLS = "skills"
    KEYWORDS = "keywords"
    
    # Google Maps specific fields
    RATING = "rating"
    REVIEWS_COUNT = "reviews_count"
    HOURS = "hours"
    PRICE_LEVEL = "price_level"
    PLUS_CODE = "plus_code"
    PLACE_ID = "place_id"
    MAPS_URL = "maps_url"
    BUSINESS_TYPE = "business_type"
    AMENITIES = "amenities"
    PHOTOS_COUNT = "photos_count"

class ScrapeRequest(BaseModel):
    urls: Optional[List[str]] = Field(default=None, max_length=10)
    lead_count: int = Field(default=100, ge=1, le=50000)
    fields: List[FieldType] = Field(default=[FieldType.NAME, FieldType.EMAIL])
    apify_token: str = Field(..., min_length=1)
    
    @validator('urls')
    def validate_urls(cls, v):
        if v:  # Only validate if URLs are provided
            for url in v:
                if not url.startswith(('http://', 'https://')):
                    raise ValueError('Invalid URL format')
        return v

class SheetsRequest(BaseModel):
    spreadsheet_id: str
    sheet_name: str = "Leads"
    data: List[Dict[str, Any]]
    google_credentials: Dict[str, Any]

class NotionRequest(BaseModel):
    database_id: str
    data: List[Dict[str, Any]]
    notion_token: str

class ScrapeResponse(BaseModel):
    task_id: str
    status: str
    message: str
    data: Optional[List[Dict[str, Any]]] = None
    total_count: Optional[int] = None

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str = "1.0.0"
    services: Dict[str, str]

class TaskStatus(BaseModel):
    task_id: str
    status: str
    progress: int
    message: str
    data: Optional[List[Dict[str, Any]]] = None
    total_count: Optional[int] = None

class ExportResponse(BaseModel):
    status: str
    message: str
    created_count: Optional[int] = None
    updated_rows: Optional[int] = None
    errors: Optional[List[str]] = None

class GoogleMapsScrapeRequest(BaseModel):
    search_terms: Optional[List[str]] = Field(default=None, max_length=10)
    location: Optional[str] = Field(default=None, max_length=200)
    maps_urls: Optional[List[str]] = Field(default=None, max_length=10)
    max_places: int = Field(default=50, ge=1, le=1000)
    min_stars: Optional[str] = Field(default="", pattern="^[1-5]?$")
    enrichment_records: int = Field(default=0, ge=0, le=10)
    skip_closed: bool = Field(default=False)
    fields: List[FieldType] = Field(default=[FieldType.NAME, FieldType.PHONE, FieldType.LOCATION])
    apify_token: str = Field(..., min_length=1)
    
    @validator('search_terms', 'maps_urls')
    def validate_search_input(cls, v, values):
        # At least one of search_terms+location or maps_urls must be provided
        search_terms = values.get('search_terms') if 'search_terms' in values else v
        maps_urls = values.get('maps_urls') if 'maps_urls' in values else None
        location = values.get('location', '')
        
        # Check if we have either search terms with location, or maps URLs
        has_search = search_terms and location
        has_urls = maps_urls and len(maps_urls) > 0
        
        if not has_search and not has_urls:
            raise ValueError('Either provide search_terms with location, or maps_urls')
        
        return v
    
    @validator('maps_urls')
    def validate_maps_urls(cls, v):
        if v:
            for url in v:
                if not url.startswith(('http://', 'https://')) or 'google.com/maps' not in url.lower():
                    raise ValueError('Invalid Google Maps URL format')
        return v

class CombinedScrapeRequest(BaseModel):
    # Apollo.io fields
    apollo_urls: Optional[List[str]] = Field(default=None, max_length=10)
    
    # Google Maps fields
    search_terms: Optional[List[str]] = Field(default=None, max_length=10)
    location: Optional[str] = Field(default=None, max_length=200)
    maps_urls: Optional[List[str]] = Field(default=None, max_length=10)
    max_places: int = Field(default=50, ge=1, le=1000)
    min_stars: Optional[str] = Field(default="", pattern="^[1-5]?$")
    enrichment_records: int = Field(default=0, ge=0, le=10)
    skip_closed: bool = Field(default=False)
    
    # Common fields
    lead_count: int = Field(default=100, ge=1, le=50000)
    fields: List[FieldType] = Field(default=[FieldType.NAME, FieldType.EMAIL])
    apify_token: str = Field(..., min_length=1)
    
    @validator('apollo_urls')
    def validate_apollo_urls(cls, v):
        if v:  # Only validate if URLs are provided
            for url in v:
                if not url.startswith(('http://', 'https://')):
                    raise ValueError('Invalid Apollo URL format')
        return v
    
    @validator('maps_urls')
    def validate_maps_urls(cls, v):
        if v:
            for url in v:
                if not url.startswith(('http://', 'https://')) or 'google.com/maps' not in url.lower():
                    raise ValueError('Invalid Google Maps URL format')
        return v
    
    @validator('fields')
    def validate_at_least_one_source(cls, v, values):
        # Check if at least one scraping source is provided
        apollo_urls = values.get('apollo_urls')
        search_terms = values.get('search_terms')
        location = values.get('location')
        maps_urls = values.get('maps_urls')
        
        has_apollo = apollo_urls and len(apollo_urls) > 0
        has_maps_search = search_terms and location
        has_maps_urls = maps_urls and len(maps_urls) > 0
        
        if not (has_apollo or has_maps_search or has_maps_urls):
            raise ValueError('At least one scraping source must be provided: Apollo URLs, or Google Maps (search terms + location), or Google Maps URLs')
        
        return v
