How to use search terms and categories
Search terms
Each search term is scraped separately for the whole area. Thus 10 search terms will take 10 times as long as a single search term. Use only a smaller count of non-overlapping search terms to optimize the scraping process. A big list of very similar search terms will increase the runtime without providing much additional data.

Example of a good list of search terms: [restaurant, hotel, grocery, pharmacy] Example of a bad list of search terms: [restaurant, restaurants, chinese restaurant, cafe, coffee, coffee shop, takeout]

Google search results often include categories adjacent to your search, e.g. restaurant might also capture some cafe or bar places, but you will get more results if you use them as separate search terms. There isn't a hard rule on when to use a single search term or multiple, you might need a test run on a small location for your particular search terms and make a tradeoff. In any case, avoid very similar search terms.

Categories
Using categories is dangerous!

Search terms can introduce false positive results (e.g. categories you don't want). Categories can be used to narrow down the results only to the ones you select.

Categories are dangerous because they can cause false negatives, excluding places you want in the results. Google has thousands of categories and there are many synonymous ones. Moreover, the categories are selected by the place owners so they can always introduce arbitrary ones. You must list all categories you want to match, including all synonyms! E.g. Divorce lawyer, Divorce service, and Divorce attorney are distinct categories and some places might have only one of them and you have to include that one.

To help with this, our Actor tries to increase the chance of a match:

If any category of a place (each can have several categories) matches any category from your input, it will be included.
If all words from your input are contained in a category name, it will be included. E.g. restaurant will match Chinese restaurant and Pan Asian restaurant.
If categories are used without search terms, they will be used both as search terms and as category filters. However, for the above reasons, using categories without search terms is not recommended.

⬆️ Output example
The results will be wrapped into a dataset which you can find in the Storage tab. Note that the output is organized in table and tabs for viewing convenience:
Once the run is finished, you can download the dataset in various data formats (JSON, CSV, Excel, XML, HTML). Note that you can always set up additional fields to filter out specific Google Maps data before you decide to export it.

⚡ Leads Enrichment Contact Details
You can scrape detailed professional information about individuals at the businesses you're targeting by setting the "⏩ Add-on: Extract business leads information - Maximum leads per place" parameter (maximumLeadsEnrichmentRecords) to a value greater than 0. This feature allows you to access LinkedIn URLs, job titles, departments, profile pictures, and other social profiles for each place found with a website.

Here's an example of what an enriched contact record looks like:
{
    "person_id": "3556796657037214368",
    "first_name": "Radek",
    "last_name": "Topolcany",
    "full_name": "Radek Topolcany",
    "linkedin_profile": "https://cz.linkedin.com/in/radek-topol%C4%8D%C3%A1ny-426681136",
    "email": "radek.topolcany@bcas.cz",
    "mobile_number": null,
    "job_title": "Konzultatnt",
    "industry": "Financial Services",
    "city": null,
    "state": "Central Bohemia",
    "country": "Czechia",
    "company_id": "2424768419158032384",
    "company_name": "Broker Consulting a.s",
    "company_website": "bcas.cz",
    "company_size": "501 - 1000",
    "company_linkedin": "https://www.linkedin.com/company/786541",
    "company_city": null,
    "company_state": null,
    "company_country": "Czechia",
    "company_phone_number": null
}

When using the extract leads details feature, you can control exactly what information is collected:

Set the maximum number of leads enrichment records to collect per place using the "⏩ Add-on: Extract business leads information - Maximum leads per place" (maximumLeadsEnrichmentRecords) parameter
Filter results to specific departments by selecting from options in the "Leads departments selection" (leadsEnrichmentDepartments) parameter, including C-Suite, Marketing, Sales, Engineering & Technical, Human Resource, and others

Visualizing scraped results

Google Maps Scraper provides a visual map page that renders the scraped places. You can zoom in and out to for different granulatity. The map is shown in the "Live View" tab on the actor run page and also stored in the Key-Value Store as results-map.html record.

Location vs. Geolocation
Location, country, state, county, city, and postal code
Using free text in 📍 Location field should normally be enough. But you can instead turn to 📡 Geolocation parameters field and use a combination of country, state, county, city, and postalCode in if 📍 Location isn’t specific enough for your search.

This scraper uses Open Street Map for geolocation API. You can easily check the location matching your geolocation input on the official Open Street Map page.

📡 Geolocation parameters section
This section will teach you to customize geolocation features, overcome the 120 results limit or skip large areas such as lakes or forests.

You can also follow this video guide or this step-by-step explanation.

🔎 Automatic zooming to overcome the Google Maps limit
If you look at Google Maps website, you’ll notice that when zooming out, you can see less of Google places pins. You'll also notice that zooming in on smaller areas (making zoom higher) can uncover many of those hidden pins. The advantage of higher zoom is that it can find - and scrape - more places (shown as pins). However, locations with higher zoom also take significantly longer to scrape and are more computationally expensive. Generally, there are diminishing returns for increasing zoom.

By default, you don’t have to set up this parameter. The scraper automatically zooms on the location on Google Maps to ensure the most efficient scraping based on the size of the scraped area. But of course, you can override the default zoom. zoom can be any number between 1 (a whole globe) and 21 (a few houses). Currently, example zoom values for various locations are (maximum for automatic is 17):

United States - 10 zoom (10,371,139 km2)
Germany - 12 zoom (380,878 km2)
London - 15 zoom (1,595 km2)
Manhattan - 16 zoom (87.5 km2)
Soho - 17 zoom (0.35 km2)
If you need guidance on how to run the Google Maps Scraper with zoom, follow our step-by-step tutorial 🔗 or video guide ▷ on YouTube.

🛰 Custom search area
If your location can’t be found on Google Maps or you want to customize it for a specific area, you can use the Custom search area function. You’ll have to provide coordinate pairs for an area and the scraper will create start URLs out of them. As an example, see the geojson field in Nominatim Api (example of Cambridge in Great Britain).

There are several types of search area geometry that you can use in Google Maps Scraper: Polygon, MultiPolygon and Point (Circle). All of them follow the official Geo Json RFC and all types are supported. We’ve found the polygons and circle to be the most useful ones when it comes to scraping.

Note that the order of longitude and latitude is reversed in GeoJson 🔄 compared to the Google Maps website. The first field must be longitude ↕️, the second field must be latitude ↔️.

We recommend using Geojson.io to create customGeolocation of any type/shape in correct format. You can watch this video on how to use it together with our scraper.

💠 Polygon

The most common type is a polygon, which is a set of points that define the scraped area. Note that the first and last pair of coordinates must be identical (to close the polygon). This example covers most of the city of London, UK:

{
    "type": "Polygon",
    "coordinates": [
        [
            [
                // Must be the same as last one
                -0.322813, // Longitude
                51.597165 // Latitude
            ],
            [
                -0.314990,
                51.388023
            ],
            [
                0.060493,
                51.389199
            ],
            [
                0.051936,
                51.600360
            ],
            [
                // Must be the same as the first one
                -0.322813,
                51.597165
            ]
        // ...
        ]
    ]
}

💠💠 MultiPolygon

MultiPolygon can combine more polygons that are not continuous together (can be an island + part of mainland). Same as with the polygon, make sure the first and the last pair of coordinates in each polygon are identical.
{
    "type": "MultiPolygon",
    "coordinates": [
        [ // first polygon
            [
                [
                    12.0905752, // Longitude
                    50.2524063  // Latitude
                ],
                [
                    12.1269337,
                    50.2324336
                ],
                // ...
            ]
        ],
        [
            // second polygon
            // ...
        ]
    ]
}

 Circle

For a circle, we can use the Point type with our custom parameter radiusKm. Don't forget to change the radius to fit your needs. This example covers the city of Basel in Switzerland:

{
    "type": "Point",
    "coordinates": ["7.5503", "47.5590"],
    "radiusKm": 8
}



