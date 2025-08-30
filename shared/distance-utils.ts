// Shared distance calculation utilities for both frontend and backend

// Enhanced distance calculation using major transportation centers for more accurate mileage
// These coordinates represent major freight/trucking hubs in each state for realistic routing
export const stateCoordinates: Record<string, { lat: number; lng: number }> = {
  "AL": { lat: 32.3617, lng: -86.7947 }, // Montgomery area (I-65/I-85 interchange)
  "AK": { lat: 61.2181, lng: -149.9003 }, // Anchorage (major freight hub)
  "AZ": { lat: 33.5722, lng: -112.0892 }, // Phoenix (I-10/I-17 interchange)
  "AR": { lat: 34.7465, lng: -92.2896 }, // Little Rock (I-40/I-430 area)
  "CA": { lat: 34.0522, lng: -118.2437 }, // Los Angeles (major freight corridor)
  "CO": { lat: 39.7392, lng: -104.9903 }, // Denver (I-25/I-70 interchange)
  "CT": { lat: 41.7658, lng: -72.6734 }, // Hartford (I-84/I-91 interchange)
  "DE": { lat: 39.1612, lng: -75.5264 }, // Wilmington (I-95 corridor)
  "FL": { lat: 28.5383, lng: -81.3792 }, // Orlando (I-4/FL Turnpike)
  "GA": { lat: 33.7490, lng: -84.3880 }, // Atlanta (major freight hub)
  "HI": { lat: 21.3099, lng: -157.8581 }, // Honolulu (main port)
  "ID": { lat: 43.6150, lng: -116.2023 }, // Boise (I-84 corridor)
  "IL": { lat: 41.8781, lng: -87.6298 }, // Chicago (major freight hub)
  "IN": { lat: 39.7684, lng: -86.1581 }, // Indianapolis (I-65/I-70 intersection)
  "IA": { lat: 41.5868, lng: -93.6250 }, // Des Moines (I-35/I-80 intersection)
  "KS": { lat: 39.0473, lng: -95.6890 }, // Kansas City area (major freight hub)
  "KY": { lat: 38.2009, lng: -84.8733 }, // Louisville (I-64/I-65 interchange)
  "LA": { lat: 29.9511, lng: -90.0715 }, // New Orleans (major port)
  "ME": { lat: 45.2538, lng: -69.4455 }, // Augusta/Bangor area (I-95)
  "MD": { lat: 39.0458, lng: -76.6413 }, // Baltimore (I-95/I-695 area)
  "MA": { lat: 42.2352, lng: -71.0275 }, // Boston area (I-95/I-90)
  "MI": { lat: 42.3314, lng: -84.5951 }, // Detroit area (I-94/I-75)
  "MN": { lat: 44.9537, lng: -93.0900 }, // Minneapolis (I-35/I-94)
  "MS": { lat: 32.2988, lng: -90.1848 }, // Jackson (I-55/I-20)
  "MO": { lat: 39.0997, lng: -94.5786 }, // Kansas City (I-35/I-70)
  "MT": { lat: 45.7833, lng: -108.5007 }, // Billings (I-90/I-94)
  "NE": { lat: 41.2524, lng: -95.9980 }, // Omaha (I-80/I-680)
  "NV": { lat: 39.1638, lng: -119.7674 }, // Reno (I-80 corridor)
  "NH": { lat: 43.2081, lng: -71.5376 }, // Manchester (I-93/I-95)
  "NJ": { lat: 40.0583, lng: -74.4057 }, // Trenton area (I-95/NJ Turnpike)
  "NM": { lat: 35.0844, lng: -106.6504 }, // Albuquerque (I-40/I-25)
  "NY": { lat: 42.1584, lng: -74.9384 }, // Syracuse area (I-90/I-81)
  "NC": { lat: 35.7796, lng: -78.6382 }, // Raleigh (I-40/I-95)
  "ND": { lat: 46.8083, lng: -100.7837 }, // Bismarck (I-94)
  "OH": { lat: 39.9612, lng: -82.9988 }, // Columbus (I-70/I-71)
  "OK": { lat: 35.4676, lng: -97.5164 }, // Oklahoma City (I-35/I-40)
  "OR": { lat: 45.5152, lng: -122.6784 }, // Portland (I-5/I-84)
  "PA": { lat: 40.2732, lng: -76.8839 }, // Harrisburg (I-76/I-81)
  "RI": { lat: 41.8240, lng: -71.4128 }, // Providence (I-95/I-195)
  "SC": { lat: 34.0000, lng: -81.0348 }, // Columbia (I-20/I-77)
  "SD": { lat: 44.2998, lng: -100.3360 }, // Pierre area (I-90)
  "TN": { lat: 36.1627, lng: -86.7816 }, // Nashville (I-40/I-65)
  "TX": { lat: 32.7767, lng: -96.7970 }, // Dallas (major freight hub)
  "UT": { lat: 40.7608, lng: -111.8910 }, // Salt Lake City (I-80/I-15)
  "VT": { lat: 44.2601, lng: -72.5806 }, // Montpelier (I-89)
  "VA": { lat: 37.4316, lng: -78.6569 }, // Richmond (I-95/I-64)
  "WA": { lat: 47.0379, lng: -122.9007 }, // Seattle/Tacoma (I-5/I-90)
  "WV": { lat: 39.6403, lng: -79.9553 }, // Charleston (I-64/I-77)
  "WI": { lat: 43.0642, lng: -87.9073 }, // Milwaukee (I-94/I-43)
  "WY": { lat: 41.1400, lng: -104.8197 }, // Cheyenne (I-80/I-25)
};

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function calculateRoutingFactor(straightLineDistance: number, originState: string, destinationState: string): number {
  // Enhanced routing factor for practical trucking distances
  let factor = 1.25; // Increased base factor for more realistic road routing
  
  // Distance-based routing efficiency
  if (straightLineDistance > 1000) {
    factor = 1.15; // Cross-country routes are most direct (interstate highways)
  } else if (straightLineDistance > 600) {
    factor = 1.18; // Long hauls still fairly direct
  } else if (straightLineDistance > 400) {
    factor = 1.22; // Medium distance routes
  } else if (straightLineDistance > 200) {
    factor = 1.26; // Regional routes with more turns
  } else {
    factor = 1.35; // Short hauls with local roads, traffic, urban routing
  }
  
  // Regional and terrain adjustments
  const mountainousStates = ['CO', 'MT', 'WY', 'UT', 'NV', 'WV', 'PA', 'VA', 'NC', 'TN', 'KY'];
  const denseUrbanStates = ['NY', 'NJ', 'CT', 'MA', 'RI', 'MD', 'DE', 'CA'];
  const flatInterstateStates = ['TX', 'OK', 'KS', 'NE', 'IA', 'IL', 'IN', 'OH'];
  
  // Terrain adjustments
  if (mountainousStates.includes(originState) || mountainousStates.includes(destinationState)) {
    factor += 0.04; // Add 4% for mountainous terrain routing
  }
  
  if (denseUrbanStates.includes(originState) || denseUrbanStates.includes(destinationState)) {
    factor += 0.03; // Add 3% for urban congestion and complex routing
  }
  
  // Interstate efficiency for flat states
  if (flatInterstateStates.includes(originState) && flatInterstateStates.includes(destinationState)) {
    factor -= 0.02; // Subtract 2% for efficient interstate travel
  }
  
  // Specific route adjustments for known inefficient corridors
  if ((originState === 'MS' && destinationState === 'TX') || (originState === 'TX' && destinationState === 'MS')) {
    factor += 0.02; // MS-TX routes often require routing around Louisiana/Mississippi River
  }
  
  return Math.max(factor, 1.10); // Minimum 10% increase over straight line
}

// Major city coordinates for precise distance calculations
export const cityCoordinates: Record<string, { lat: number; lng: number; state: string }> = {
  // Tennessee cities
  "Memphis": { lat: 35.1495, lng: -90.0490, state: "TN" },
  "Nashville": { lat: 36.1627, lng: -86.7816, state: "TN" },
  "Knoxville": { lat: 35.9606, lng: -83.9207, state: "TN" },
  "Chattanooga": { lat: 35.0456, lng: -85.2672, state: "TN" },
  
  // Mississippi cities
  "Byhalia": { lat: 34.8373, lng: -89.6850, state: "MS" },
  "Jackson": { lat: 32.2988, lng: -90.1848, state: "MS" },
  "Gulfport": { lat: 30.3674, lng: -89.0928, state: "MS" },
  "Biloxi": { lat: 30.3960, lng: -88.8853, state: "MS" },
  "Hattiesburg": { lat: 31.3271, lng: -89.2903, state: "MS" },
  "Meridian": { lat: 32.3643, lng: -88.7034, state: "MS" },
  "Tupelo": { lat: 34.2576, lng: -88.7034, state: "MS" },
  
  // Georgia cities
  "Atlanta": { lat: 33.7490, lng: -84.3880, state: "GA" },
  "Savannah": { lat: 32.0835, lng: -81.0998, state: "GA" },
  "Augusta": { lat: 33.4734, lng: -82.0105, state: "GA" },
  "Columbus, GA": { lat: 32.4609, lng: -84.9877, state: "GA" },
  "Macon": { lat: 32.8407, lng: -83.6324, state: "GA" },
  
  // Pennsylvania cities
  "Pittsburgh": { lat: 40.4406, lng: -79.9959, state: "PA" },
  "Philadelphia": { lat: 39.9526, lng: -75.1652, state: "PA" },
  "Harrisburg": { lat: 40.2732, lng: -76.8839, state: "PA" },
  "Allentown": { lat: 40.6084, lng: -75.4902, state: "PA" },
  
  // Ohio cities
  "Euclid": { lat: 41.5931, lng: -81.5265, state: "OH" },
  "Cleveland": { lat: 41.4993, lng: -81.6944, state: "OH" },
  "Columbus, OH": { lat: 39.9612, lng: -82.9988, state: "OH" },
  "Cincinnati": { lat: 39.1031, lng: -84.5120, state: "OH" },
  "Toledo": { lat: 41.6528, lng: -83.5379, state: "OH" },
  "Akron": { lat: 41.0814, lng: -81.5190, state: "OH" },
  
  // Add more major freight cities as needed
  "Chicago": { lat: 41.8781, lng: -87.6298, state: "IL" },
  "Indianapolis": { lat: 39.7684, lng: -86.1581, state: "IN" },
  "Louisville": { lat: 38.2527, lng: -85.7585, state: "KY" },
  "Birmingham": { lat: 33.5207, lng: -86.8025, state: "AL" },
  "New Orleans": { lat: 29.9511, lng: -90.0715, state: "LA" },
  "Houston": { lat: 29.7604, lng: -95.3698, state: "TX" },
  "Dallas": { lat: 32.7767, lng: -96.7970, state: "TX" },
  "Rosenberg": { lat: 29.5575, lng: -95.8088, state: "TX" },
  "Baytown": { lat: 29.7355, lng: -94.9774, state: "TX" },
  "Hudson": { lat: 28.3642, lng: -82.6890, state: "FL" },
  "Tampa": { lat: 27.9506, lng: -82.4572, state: "FL" },
  "Lakeland": { lat: 28.0395, lng: -81.9498, state: "FL" },
  "Orlando": { lat: 28.5383, lng: -81.3792, state: "FL" },
  "Jacksonville": { lat: 30.3322, lng: -81.6557, state: "FL" },
  "Miami": { lat: 25.7617, lng: -80.1918, state: "FL" },
  "Kansas City": { lat: 39.0997, lng: -94.5786, state: "MO" },
  
  // North Carolina cities
  "Charlotte": { lat: 35.2271, lng: -80.8431, state: "NC" },
  "Raleigh": { lat: 35.7796, lng: -78.6382, state: "NC" },
  "Greensboro": { lat: 36.0726, lng: -79.7920, state: "NC" },
  "Fayetteville": { lat: 35.0527, lng: -78.8784, state: "NC" },
  "Wilmington": { lat: 34.2257, lng: -77.9447, state: "NC" },
  "Asheville": { lat: 35.5951, lng: -82.5515, state: "NC" },
};

// Known trucking route distances (based on actual highway routes)
const knownTruckingRoutes: Record<string, number> = {
  // Mississippi to Texas routes
  "Byhalia,MS-Rosenberg,TX": 682,
  "Rosenberg,TX-Byhalia,MS": 682,
  "Memphis,TN-Rosenberg,TX": 720,
  "Rosenberg,TX-Memphis,TN": 720,
  "Jackson,MS-Houston,TX": 352,
  "Houston,TX-Jackson,MS": 352,
  
  // Other common trucking routes
  "Memphis,TN-Atlanta,GA": 371,
  "Atlanta,GA-Memphis,TN": 371,
  "Chicago,IL-Memphis,TN": 341,
  "Memphis,TN-Chicago,IL": 341,
  "Louisville,KY-Memphis,TN": 305,
  "Memphis,TN-Louisville,KY": 305,
};

// Calculate distance between two cities or states
export function calculateDistanceBetweenCities(originCity: string, originState: string, destCity: string, destState: string): number {
  // First check for known trucking routes
  const routeKey1 = `${originCity},${originState}-${destCity},${destState}`;
  const routeKey2 = `${destCity},${destState}-${originCity},${originState}`;
  
  console.log(`[Distance Debug] Checking known routes: ${routeKey1}`);
  
  if (knownTruckingRoutes[routeKey1]) {
    const knownDistance = knownTruckingRoutes[routeKey1];
    console.log(`[Distance Debug] Found known trucking route: ${routeKey1} = ${knownDistance} miles`);
    return knownDistance;
  }
  
  if (knownTruckingRoutes[routeKey2]) {
    const knownDistance = knownTruckingRoutes[routeKey2];
    console.log(`[Distance Debug] Found known trucking route (reverse): ${routeKey2} = ${knownDistance} miles`);
    return knownDistance;
  }
  
  // Try city-to-city calculation for other routes
  const originCityKey = originCity;
  const destCityKey = destCity;
  
  const originCityCoords = cityCoordinates[originCityKey];
  const destCityCoords = cityCoordinates[destCityKey];
  
  console.log(`[Distance Debug] Looking for cities: ${originCityKey} (${originState}) -> ${destCityKey} (${destState})`);
  console.log(`[Distance Debug] Origin coords found:`, originCityCoords);
  console.log(`[Distance Debug] Dest coords found:`, destCityCoords);
  
  if (originCityCoords && destCityCoords) {
    // Use precise city coordinates
    const distance = calculateHaversineDistance(
      originCityCoords.lat, originCityCoords.lng,
      destCityCoords.lat, destCityCoords.lng
    );
    
    // Apply routing factor for city-to-city
    const routingFactor = calculateRoutingFactor(distance, originState, destState);
    const finalDistance = Math.round(distance * routingFactor);
    console.log(`[Distance Debug] City-to-city calculation: ${distance.toFixed(2)} miles (straight line) * ${routingFactor} (routing factor) = ${finalDistance} miles`);
    return finalDistance;
  }
  
  // No fallback - return 0 if cities not found to force manual entry
  console.log(`[Distance Debug] Cities not found in database - no calculation performed`);
  console.log(`[Distance Debug] Available cities:`, Object.keys(cityCoordinates));
  console.log(`[Distance Debug] Available known routes:`, Object.keys(knownTruckingRoutes));
  return 0;
}

function calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateDistance(originState: string, destinationState: string): number {
  if (!originState || !destinationState || originState === destinationState) {
    return 0;
  }

  const origin = stateCoordinates[originState];
  const destination = stateCoordinates[destinationState];

  if (!origin || !destination) {
    return 0;
  }

  // Haversine formula for straight-line distance calculation
  const straightLineDistance = calculateHaversineDistance(
    origin.lat, origin.lng,
    destination.lat, destination.lng
  );

  // Apply trucking route factor to convert straight-line to road miles
  const routingFactor = calculateRoutingFactor(straightLineDistance, originState, destinationState);
  const roadDistance = straightLineDistance * routingFactor;

  return Math.round(roadDistance);
}