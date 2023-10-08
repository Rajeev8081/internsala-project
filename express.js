const _ = require('lodash');
const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;


const cacheMiddleware = (duration) => {
  const cache = new Map();

  return async (req, res, next) => {
    const key = req.originalUrl || req.url;
    const cachedData = cache.get(key);

    if (cachedData) {
      console.log('Cache hit for:', key);
      return res.json(cachedData);
    }

    console.log('Cache miss for:', key);
    const response = await next();
    cache.set(key, response, duration);
    return response;
  };
};


const analyticsCacheDuration = 60000; 
const searchCacheDuration = 30000; // 30 seconds


app.get(
  '/api/blog-stats',
  cacheMiddleware(analyticsCacheDuration),
  async (req, res) => {
    try {
      const curlUrl = 'https://intent-kit-16.hasura.app/api/rest/blogs';
      const curlHeaders = {
        'x-hasura-admin-secret':
          '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
      };

    
      const response = await axios.get(curlUrl, { headers: curlHeaders });

      
      const blogData = response.data; 

      
      const totalBlogs = blogData.length;

      
      const blogWithLongestTitle = _.maxBy(blogData, (blog) =>
        blog.title.length
      );

      
      const blogsWithPrivacyKeyword = _.filter(blogData, (blog) =>
        _.includes(_.toLower(blog.title), 'privacy')
      ).length;

      
      const uniqueBlogTitles = _.uniqBy(blogData, 'title');

      
      res.json({
        totalBlogs,
        longestBlogTitle: blogWithLongestTitle.title,
        blogsContainingPrivacyKeyword: blogsWithPrivacyKeyword,
        uniqueBlogTitles: uniqueBlogTitles.map((blog) => blog.title),
      });
    } catch (error) {
     
      console.error(error);
      res
        .status(500)
        .json({ error: 'An error occurred while fetching and processing blog data.' });
    }
  }
);


app.get(
  '/api/blog-search',
  cacheMiddleware(searchCacheDuration),
  (req, res) => {
    try {
      const query = req.query.query.toLowerCase(); 

      // Filter the blog data based on the query (case-insensitive)
      const matchingBlogs = blogData.filter(
        (blog) =>
          blog.title.toLowerCase().includes(query) ||
          blog.content.toLowerCase().includes(query)
      );

      // Send the matching blogs as a JSON response
      res.json(matchingBlogs);
    } catch (error) {
      // Handle errors and send an appropriate error response
      console.error(error);
      res.status(500).json({ error: 'An error occurred while searching for blogs.' });
    }
  }
);

// Define your blogData here or fetch it from an external source
const blogData = []; // Replace with your actual blog data

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
