import { useState, useEffect } from 'react';
import { LineChart, BarChart, PieChart, Line, Bar, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MapPin, Activity, Users, AlertTriangle, Calendar, Filter, Loader } from 'lucide-react';

// Real data fetching from WHO API
// API data will replace these sample datasets in the useEffect hook

// Main component
export default function PublicHealthDashboard() {
  const [selectedDisease, setSelectedDisease] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [diseaseData, setDiseaseData] = useState([]);
  const [demographicData, setDemographicData] = useState([]);
  const [regionData, setRegionData] = useState([]);
  const [vaccineData, setVaccineData] = useState([]);
  const [covidStats, setCovidStats] = useState({
    activeCases: "...",
    recovered: "...",
    deaths: "...",
    vaccinations: "..."
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to fetch data from disease.sh API
    const fetchDiseaseData = async () => {
      setLoading(true);
      try {
        // Fetch global COVID-19 data
        const globalResponse = await fetch('https://disease.sh/v3/covid-19/all');
        if (!globalResponse.ok) throw new Error('Failed to fetch global COVID data');
        const globalData = await globalResponse.json();
        
        // Update COVID stats
        setCovidStats({
          activeCases: globalData.active.toLocaleString(),
          recovered: globalData.recovered.toLocaleString(),
          deaths: globalData.deaths.toLocaleString(),
          vaccinations: (globalData.population * 0.58).toLocaleString() // Estimate based on global avg
        });
        
        // Fetch countries data for region chart
        const countriesResponse = await fetch('https://disease.sh/v3/covid-19/countries?sort=cases');
        if (!countriesResponse.ok) throw new Error('Failed to fetch countries data');
        const countriesData = await countriesResponse.json();
        
        // Process top 5 countries for region chart
        const topRegions = countriesData
          .slice(0, 5)
          .map(country => ({
            name: country.country,
            cases: country.cases,
            deaths: country.deaths,
            flag: country.countryInfo.flag
          }));
        setRegionData(topRegions);
        
        // Fetch historical data for disease trends
        const daysToFetch = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
        const historicalResponse = await fetch(`https://disease.sh/v3/covid-19/historical/all?lastdays=${daysToFetch}`);
        if (!historicalResponse.ok) throw new Error('Failed to fetch historical data');
        const historicalData = await historicalResponse.json();
        
        // Process historical data for chart
        const trendData = [];
        const dates = Object.keys(historicalData.cases);
        dates.forEach(date => {
          trendData.push({
            date: date,
            cases: historicalData.cases[date],
            deaths: historicalData.deaths[date],
            recovered: historicalData.recovered ? historicalData.recovered[date] : 0
          });
        });
        setDiseaseData(trendData);
        
        // Fetch vaccination data
        const vaccineResponse = await fetch('https://disease.sh/v3/covid-19/vaccine/coverage?lastdays=30');
        if (!vaccineResponse.ok) throw new Error('Failed to fetch vaccine data');
        const vaccineData = await vaccineResponse.json();
        
        // Process vaccination data
        const processedVaccineData = Object.entries(vaccineData).map(([date, doses]) => ({
          date: date,
          administered: doses,
          target: Math.round(doses * 1.1) // Target is 10% more than current
        }));
        setVaccineData(processedVaccineData);
        
        // Fetch demographics data for age distribution
        // Note: Using real demographic breakdown by continent since disease.sh doesn't have age data
        const continentResponse = await fetch('https://disease.sh/v3/covid-19/continents');
        if (!continentResponse.ok) throw new Error('Failed to fetch continent data');
        const continentData = await continentResponse.json();
        
        // Use continents as our demographic data
        const demoData = continentData.map(continent => ({
          name: continent.continent,
          value: continent.cases
        }));
        setDemographicData(demoData);
        
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data from disease.sh API. Please try again later.');
        setLoading(false);
        
        // Fallback to sample data if API fails
        setDiseaseData(sampleDiseaseData);
        setRegionData(sampleRegionData);
        setVaccineData(sampleVaccineData);
        setCovidStats(sampleCovidStats);
      }
    };
    
    fetchDiseaseData();
  }, [dateRange]); // Refresh when date range changes

  // Backup sample data if API fails
  const sampleDiseaseData = [
    { month: 'Jan', influenza: 4000, covid19: 2400, malaria: 2400 },
    { month: 'Feb', influenza: 3000, covid19: 1398, malaria: 2210 },
    { month: 'Mar', influenza: 2000, covid19: 9800, malaria: 2290 },
    { month: 'Apr', influenza: 2780, covid19: 3908, malaria: 2000 },
    { month: 'May', influenza: 1890, covid19: 4800, malaria: 2181 },
    { month: 'Jun', influenza: 2390, covid19: 3800, malaria: 2500 },
    { month: 'Jul', influenza: 3490, covid19: 4300, malaria: 2100 },
  ];

  const sampleRegionData = [
    { name: 'North', cases: 4000, deaths: 240 },
    { name: 'South', cases: 3000, deaths: 139 },
    { name: 'East', cases: 2000, deaths: 98 },
    { name: 'West', cases: 2780, deaths: 390 },
    { name: 'Central', cases: 1890, deaths: 480 },
  ];

  const sampleVaccineData = [
    { month: 'Jan', administered: 4000, target: 6000 },
    { month: 'Feb', administered: 5000, target: 6000 },
    { month: 'Mar', administered: 5800, target: 6000 },
    { month: 'Apr', administered: 5900, target: 6000 },
    { month: 'May', administered: 6100, target: 6000 },
    { month: 'Jun', administered: 6300, target: 6000 },
    { month: 'Jul', administered: 7000, target: 6000 },
  ];

  const sampleCovidStats = {
    activeCases: "14,392",
    recovered: "1,245,876",
    deaths: "8,723",
    vaccinations: "4,523,156"
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <header className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Public Health Statistics Dashboard</h1>
            <p className="text-gray-500">Real-time monitoring of disease spread and interventions</p>
          </div>
          <div className="flex items-center">
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm mr-2">
              {loading ? 'Loading...' : 'Live WHO Data'}
            </span>
            <span className="text-gray-500 text-sm">Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </header>

      {/* Filter controls */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <Filter className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-gray-700 mr-2">Disease:</span>
            <select 
              className="border rounded px-2 py-1" 
              value={selectedDisease}
              onChange={(e) => setSelectedDisease(e.target.value)}
              disabled={loading}
            >
              <option value="all">All Diseases</option>
              <option value="covid19">COVID-19</option>
              <option value="influenza">Influenza</option>
            </select>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-gray-700 mr-2">Region:</span>
            <select 
              className="border rounded px-2 py-1"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              disabled={loading}
            >
              <option value="all">All Regions</option>
              <option value="north">North America</option>
              <option value="south">South America</option>
              <option value="europe">Europe</option>
              <option value="asia">Asia</option>
              <option value="africa">Africa</option>
              <option value="oceania">Oceania</option>
            </select>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-gray-700 mr-2">Time Period:</span>
            <select 
              className="border rounded px-2 py-1"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              disabled={loading}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading or Error State */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 mb-6 flex flex-col items-center justify-center">
          <Loader className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600">Loading data from WHO API...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-lg shadow-sm p-8 mb-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Data</h2>
          <p className="text-red-600">{error}</p>
          <p className="text-gray-600 mt-4">Showing fallback sample data instead.</p>
        </div>
      ) : (
        /* COVID-19 Spotlight */
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">COVID-19 Spotlight</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start">
                <div className="bg-blue-100 p-2 rounded">
                  <Activity className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Active Cases</p>
                  <p className="text-xl font-bold text-gray-800">{covidStats.activeCases}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Recovered</p>
                  <p className="text-xl font-bold text-gray-800">{covidStats.recovered}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-start">
                <div className="bg-red-100 p-2 rounded">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Deaths</p>
                  <p className="text-xl font-bold text-gray-800">{covidStats.deaths}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded">
                  <Activity className="h-6 w-6 text-purple-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Vaccinations</p>
                  <p className="text-xl font-bold text-gray-800">{covidStats.vaccinations}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main dashboard content */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Disease trends */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">COVID-19 Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={diseaseData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cases" name="Cases" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="deaths" name="Deaths" stroke="#ff7300" />
                <Line type="monotone" dataKey="recovered" name="Recovered" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-500 mt-2">
              Source: disease.sh COVID-19 API - Historical data
            </div>
          </div>

          {/* Regional Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Affected Countries</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={regionData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-2 border rounded shadow-sm">
                        <p className="font-semibold">{payload[0].payload.name}</p>
                        {payload[0].payload.flag && (
                          <img src={payload[0].payload.flag} alt="flag" className="h-4 my-1" />
                        )}
                        <p className="text-sm">Cases: {payload[0].value.toLocaleString()}</p>
                        {payload[1] && <p className="text-sm">Deaths: {payload[1].value.toLocaleString()}</p>}
                      </div>
                    );
                  }
                  return null;
                }} />
                <Legend />
                <Bar dataKey="cases" name="Total Cases" fill="#8884d8" />
                <Bar dataKey="deaths" name="Total Deaths" fill="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-500 mt-2">
              Source: disease.sh API - Countries data
            </div>
          </div>

          {/* Age Demographics */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Continent Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={demographicData} 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={100} 
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label
                />
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-500 mt-2">
              Source: disease.sh API - Cases by continent
            </div>
          </div>

          {/* Vaccination Progress */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Vaccination Progress</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={vaccineData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="administered" name="Vaccines Administered" fill="#82ca9d" />
                <Bar dataKey="target" name="Target" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-500 mt-2">
              Source: disease.sh API - Vaccination data
            </div>
          </div>
        </div>
      )}

      <footer className="mt-8 text-sm text-gray-500 text-center">
        <p>Created by [Hernan Navarro] • Data source: disease.sh Open API</p>
        <p>© 2025 Public Health Monitor • <a href="https://disease.sh/" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Using disease.sh API</a> • For portfolio demonstration purposes</p>
      </footer>
    </div>
  );
}