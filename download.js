#!/usr/bin/env node

const fs = require('fs')
const cli = require('commander')
const { version } = require('./package.json')
const download = require('./lib/download')

const usage = '<destination dir> [options]'

cli
  .version(version)
  .usage(usage)
  .option('-d, --db-path <file path>', 'location of sqlite db', './nflickr.sqlite')
  .option('-t, --db-table <table name>', 'table name', 'nflickr_photos')
  .option('-o, --type-only <type>', 'download only items of specified type', null)
  .option('-c, --concurrent <number>', 'number of concurrent downloads', x => parseInt(x, 10), 5)
  .option('-f, --force', 'force download', false)
  .option('-n, --dry-run', 'only output files that would have been downloaded', false)
  .parse(process.argv)

const opts = [
  'dbPath',
  'dbTable',
  'typeOnly',
  'concurrent',
  'force',
  'dryRun'
].reduce((o, k) => Object.assign({}, o, { [k]: cli[k] }), {})

const die = msg => {
  console.error(msg)
  process.exit(1)
}

const destDir = cli.args[0]
if (!destDir) die(`Missing <destination dir>\n`)
try {
  const stat = fs.statSync(destDir)
  if (!stat.isDirectory()) die(`${destDir} is not a directory`)
} catch (err) {
  die(err.message)
}
opts.destDir = destDir

const output = download(opts)

let total = '?'
let current = 0
output.on('total', n => (total = n))

output
  .map(r => opts.dryRun ? `${++current}/${total}: ${r.url}\n` : `${++current}/${total}: ${r.path} ${r.bytes}b, ${r.duration}ms\n`)
  .pipe(process.stdout)
