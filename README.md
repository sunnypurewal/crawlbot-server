# Crawlbot Server

crawlbot-server is a web front-end for [crawlbot](https://npmjs.com/package/crawlbot).

![Screenshot](https://i.imgur.com/BGv9Zeq.png "Crawlbot Server")

## Usage
```
const Server = require("crawlbot-server")
const server = new Server()

server.onHTML = (html, url) => {
  // Do something with the html here
}

server.listen((options) => {
  console.log(`Crawlbot Server started at ${options.host}:${options.port}`)
})
```

This will start the server on the default port of 9999. Visit http://localhost:9999 in your browser to begin. Check the console output for HTTP status codes and errors.

## Notes

Crawlbot uses [getsitemap](https://npmjs.com/packages/getsitemap) under the hood which means it will only crawl websites that have valid [Sitemaps](http://sitemaps.org).

It also uses [hittp](https://npmjs.com/packages/hittp) to make HTTP requests so it will automatically delay requests to the same hosts by 3 seconds so the server is not overloaded by crawlbot.