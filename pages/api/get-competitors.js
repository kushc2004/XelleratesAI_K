const axios = require('axios');
const cheerio = require('cheerio');



// Function to fetch organic data
async function getOrganicData(searchQuery) {
  try {
    const url = `https://search.yahoo.com/search?p=${encodeURIComponent(searchQuery)}`;
    
    // Make the request through the proxy
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
      },
    });

    const $ = cheerio.load(response.data);
    const firstLink = $(".compTitle h3 a").first().attr("href"); // Adjust the selector to get the first search result link
    console.log(firstLink);

    const regex = /RU=([^/]+)\//;
    const match = firstLink.match(regex);
    if (match) {
      const encodedUrl = match[1];
      const decodedUrl = encodedUrl.replace(/%3a/g, ':').replace(/%2f/g, '/');
      console.log(decodedUrl);
      return decodedUrl;
    } else {
      console.error('No valid link found.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching organic data:', error.message);
  }
}

// Function to fetch competitors
async function getCompetitors(companyName) {
  try {
    // const link = await getOrganicData(companyName + " Traxcn");

    // if (!link) {
    //   console.error("No link found");
    //   return;
    // }

    // const link ='https://195.3.220.223/__cpi.php?s=YjdMaGNkQXh5bjh2allsMWRlZXBnRzNpRHRjT2oyV1d5amtuMHFiTXBNWTRXMC8vVUU5a09IUWxZNHFiYVExRFpkbFdDVEVXWGFZdXBYSUZKMWdmS0VMRERMWFdaTWpDVzJpN3NiQUJYekU9&r=aHR0cHM6Ly8xOTUuMy4yMjAuMjIzLz9rbz1zJnE9em9tYXRvK3RyYXhjbiZfX2Nwbz1hSFIwY0hNNkx5OWtkV05yWkhWamEyZHZMbU52YlE%3D&__cpo=1

    // const competitorsUrl = link + '/competitors'; 

    const competitorsUrl = 'https://195.3.220.223/d/companies/zomato/__2jvEgmeJIRXZfZMrgik_9SLb8Bjtadw7dzpFRneP1u0/competitors?__cpo=aHR0cHM6Ly90cmFjeG4uY29t';
    const competitorsResponse = await axios.get(competitorsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
      },
    });

    const $competitors = cheerio.load(competitorsResponse.data);

    const competitors = [];
    $competitors('.txn--seo-tab--companies').each((index, element) => {
      if (index >= 4) return false; // Extract only the first 4 competitors

      const name = $competitors(element).find('h2 a').text().trim();
      const foundedYear = $competitors(element).find('dt:contains("Founded Year") + dd').text().trim();
      const stage = $competitors(element).find('dt:contains("Stage") + dd').text().trim();
      const funding = $competitors(element).find('dt:contains("Funding") + dd').text().trim();

      competitors.push({ name, foundedYear, stage, funding });
    });

    return competitors;

  } catch (error) {
    console.error('Error fetching competitors:', error.message);
  }
}

// API handler
export default async function handler(req, res){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    const { query } = req;
    const searchString = query.q;

    if (!searchString) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {
        const competitors = await getCompetitors(searchString);
        if (competitors) {
            res.status(200).json({ competitors });
        } else {
            res.status(500).json({ error: 'Failed to fetch competitors' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
