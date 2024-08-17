import axios from 'axios';
import * as cheerio from 'cheerio';


export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    const BASE_URL = 'https://news.google.com';
    const { query } = req;
    const searchString = query.q;

    console.log('query: ', searchString);

    if (!searchString) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    const encodedString = encodeURI(searchString);


    try {
        const url = 'https://techcrunch.com/?s=zepto'; // Replace with the specific URL if needed
        
        
        const AXIOS_OPTIONS = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36',
            },
            params: {
                tbm: 'nws',
                hl: 'en',
                gl: 'us',
            },
            // If using a proxy, it would be included here.
            proxy: "http://df4b94bb61b0d53c989634f943d0e492a53ada15:@proxy.zenrows.com:8001"
        };
        
        axios.get(url, AXIOS_OPTIONS)
          .then(response => {
            const html = response.data;
            const $ = cheerio.load(html);
        
            const articles = [];
        
            $('li.wp-block-post').each((i, element) => {
              const title = $(element).find('h2.wp-block-post-title a').text().trim();
              const date = $(element).find('time').text().trim();
              const firstPara = $(element).find('.wp-block-post-excerpt p').text().split('.')[0].replace('…','.').replace('. ','') + '.';
        
              // Debugging output
              // console.log(`Article ${i + 1}:`);
              console.log(`Title: ${title}`);
              console.log(`Date: ${date}`);
              console.log(`First Paragraph: ${firstPara}`);
              console.log('---------------------------------');
        
              articles.push({ title, date, firstPara });
            });
        
            console.log('Extracted Articles:', articles);
            return articles;
          })
          .catch(error => {
            console.error('Error fetching the page:', error);
          });


    } catch (error) {
        console.error('Error fetching news:', error.message);
        res.status(500).json({ error: 'Error fetching news', details: error.message });
    }
}
