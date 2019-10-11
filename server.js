'use strict'
const express = require("express")
const bodyParser = require("body-parser")
const crawlbot = require("crawlbot")
const path = require("path")
const hittp = require("hittp")

const defaultOptions = {
  port: 9999,
  host: "127.0.0.1",
  maxCrawlers: 10
}

class Server {
  constructor(options=defaultOptions) {
    this.options = options
    this.app = express()
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({extended: true}));
    this.app.set("view engine", "ejs");
    const pwd = path.join(path.dirname(__filename))
    this.app.set("views", path.join(pwd, "views"))
    this.app.use(express.static(path.join(pwd, "static")))

    this.app.get("/", this.getIndex)
    this.app.post("/crawl", this.crawl)
    this.app.post("/kill", this.kill)
    this.forks = []
  }

  listen = (callback) => {
    this.app.listen(this.options.port, this.options.host, callback(this.options))
  }

  getIndex = (req, res) => {
    res.render("index", {forks:this.forks}, (err, html) => {
      if (err) {
        console.error(err)
        res.status(503).send(err)
      }
      else res.send(html)
    })
  }

  _onHTML = (html, url) => {
    if (this.onHTML) this.onHTML(html, url)
    else console.error("Implement crawlbot-server.onHTML(html,url) to receive the crawled web pages")
  }

  _onExit = (domain, proc, code, signal) => {
    let index = -1
    for (let i = 0; i < this.forks.length; i++) {
      const fork = this.forks[i]
      if (fork.process.pid === proc.pid) {
        index = i
        break
      }
    }
    if (index !== -1) this.forks.splice(index, 1)
    if (this.onExit) this.onExit(domain, proc, code, signal)
    console.log("Finished crawling ", domain.href || domain)
  }

  kill = (req, res) => {
    let pid = req.body.pid
    if (!pid) res.status(400).send("You must supply a Process ID to kill")
    pid = parseInt(pid)
    if (pid === NaN) res.status(400).send("You must supply a Process ID to kill")
    let index = -1
    for (let i = 0; i < this.forks.length; i++) {
      const fork = this.forks[i]
      if (fork.process.pid == pid) {
        index = i
        break
      }
    }
    if (index !== -1) {
      this.forks[index].process.kill(9) // SIGKILL
    }
    res.redirect("/")
  }
  
  crawl = (req, res) => {
    let domain = req.body.domain
    console.log((new Date(Date.now())).toString())
    console.log(new Date(Date.now()-86400000).toString())
    let since = req.body.since || new Date(Date.now()-86400000)
    if (!domain) {
      res.status(400).send("Please include a domain in your POST body")
      return
    }
    domain = hittp.str2url(domain)
    if (!domain) {
      res.status(400).send("Domain was not a valid URL")
      return
    }
    if (this.forks.length >= this.options.maxCrawlers) {
      res.status(428).send("Too many active crawlers")
      return
    }
    const forkedProcess = crawlbot.crawl(domain, since, this._onHTML, this._onExit)
    console.log("Crawling", domain.href || domain)
    this.forks.push({domain, process: forkedProcess})
    res.redirect("/")
  }
}

module.exports = Server