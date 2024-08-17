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
    const url = `https://techcrunch.com/?s=${encodedString}`;

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

        const allNewsInfo = await Promise.all(
            $('li.wp-block-post')
                .slice(0, 20)
                .map(async (index, element) => {
                    const title = $(element).find('h2.wp-block-post-title a').text().trim();

                    let date = $(element).find('time').text().trim();
                    const parts = date.split('•');
                    if (parts.length > 1) {
                        date = parts[1].trim();
                    }

                    //const summaryList = $(element).find('.wp-block-post-excerpt p').text().split('.')[0].replace('…', '.').replace('. ', '') + '.';
                    const summary = [];
                    //summary.push(summaryList);

                    // Extract the link to the full article
                    const articleLink = $(element).find('h2.wp-block-post-title a').attr('href');

                    // Visit the article link and extract the first two paragraphs
                    const articleSummary = await fetchArticleSummary(articleLink);

                    // Add the article summary to the summary list
                    summary.push(...articleSummary);

                    articles.push({ title, date, summary });
                    return {
                        title,
                        date,
                        summary,
                    };
                })
                .get()
        );

        res.status(200).json(articles);
    } catch (error) {
        console.error('Error fetching news:', error.message);
        res.status(500).json({ error: 'Error fetching news', details: error.message });
    }
}

async function fetchArticleSummary(link) {
    try {
        const { data } = await axios.get(link);
        const $ = cheerio.load(data);

        // Extract the first two paragraphs from the article
        const paragraphs = [];
        $('.entry-content.wp-block-post-content p')
            .slice(0, 2)
            .each((i, el) => {
                paragraphs.push($(el).text().trim());
            });

        return paragraphs.length > 0 ? paragraphs : ['Summary not available'];
    } catch (error) {
        console.error(`Error fetching article from ${link}:`, error.message);
        return ['Summary not available'];
    }
}
