import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    const BASE_URL = 'https://news.google.com';
    const { query } = req;
    const searchString = query.q;

    if (!searchString) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    const encodedString = encodeURI(searchString);
    const url = `https://techcrunch.com/?s=zepto`;

    try {
        const AXIOS_OPTIONS = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36',
            },
        };

        const response = await axios.get(url, AXIOS_OPTIONS);
        const html = response.data;
        const $ = cheerio.load(html);

        const articles = [];

        $('li.wp-block-post').each((i, element) => {
            const title = $(element).find('h2.wp-block-post-title a').text().trim();
            const date = $(element).find('time').text().trim();
            const firstPara = $(element).find('.wp-block-post-excerpt p').text().split('.')[0].replace('…','.').replace('. ','') + '.';

            articles.push({ title, date, firstPara });
        });

        return articles;

        res.status(200).json(articles);
    } catch (error) {
        console.error('Error fetching news:', error.message);
        res.status(500).json({ error: 'Error fetching news', details: error.message });
    }
}
