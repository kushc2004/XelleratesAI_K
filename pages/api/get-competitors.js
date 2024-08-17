const axios = require('axios');
const cheerio = require('cheerio');

async function getOrganicData(searchQuery) {
  try {
    const url = `https://search.yahoo.com/search?p=${encodeURIComponent(searchQuery)}`;
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

async function getCompetitors(companyName) {
  try {
    const link = await getOrganicData(companyName + " Traxcn");

    if (!link) {
      console.error("No link found");
      return;
    }

    const competitorsUrl = link + '/competitors'; // Adjust the URL based on the actual structure
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

export default async function handler(req, res){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    const { query } = req;
    const searchString = query.query;

    if (!searchString) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    const competitors = await getCompetitors(searchString);

    if (competitors) {
        res.status(200).json({ competitors });
    } else {
        res.status(500).json({ error: 'Failed to fetch competitors' });
    }
}
