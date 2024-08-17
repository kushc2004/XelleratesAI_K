const axios = require('axios');
const cheerio = require('cheerio');

async function getOrganicData(searchQuery) {
  try {
    const url = `https://search.yahoo.com/search?p=${encodeURIComponent(searchQuery)}`;
    const response = await axios.get('https://api.zenrows.com/v1/', {
      params: {
        url: url,
        apikey: apikey,
      },
    });

    const $ = cheerio.load(response.data);
    const firstLink = $(".compTitle h3 a").first().attr("href"); // Adjust the selector to get the first search result link
    console.log(firstLink);

    const str = 'https://r.search.yahoo.com/_ylt=AwrFSVv53cBm2_UGe.pXNyoA;_ylu=Y29sbwNiZjEEcG9zAzEEdnRpZAMEc2VjA3Ny/RV=2/RE=1725125369/RO=10/RU=https%3a%2f%2ftracxn.com%2fd%2fcompanies%2fzepto%2f__MywAn4omlIVSmoQGQd_una-z9EUqUZEdfFVcaSxbWZc/RK=2/RS=g.ldhJb2f7VJy.W05uD.cjc3p_w-';
    const regex = /RU=([^/]+)\//;
    const match = str.match(regex);
    const encodedUrl = match[1];
    const t = encodedUrl.replace(/%3a/g, ':').replace(/%2f/g, '/');
    console.log(t);
    return t;
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

    const url = `${competitorsUrl}`;
    const competitorsResponse = await axios.get('https://api.zenrows.com/v1/', {
      params: {
        url: url,
        apikey: apikey,
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
    const searchString = query.q;

    if (!searchString) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    const competitors = getCompetitors(searchString);

    return competitors;
}
