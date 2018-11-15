var chalk = require('chalk')
var dns = require('dns');
var argv = require('minimist')(process.argv.splice(2))
var debug = require('debug')('geoip2lookup')
var path = require('path')
var fs = require('fs')
var maxmind = require('maxmind');
var geoip

var config = {
    geoip : {
        file: fs.existsSync('/usr/local/var/GeoIP/GeoIP2-Country.mmdb') 
            ? '/usr/local/var/GeoIP/GeoIP2-Country.mmdb' 
            : (fs.existsSync('/usr/share/GeoIP/GeoIP2-Country.mmdb') ?'/usr/share/GeoIP/GeoIP2-Country.mmdb'  : path.join(__dirname,'assets/GeoIP2-Country.mmdb'))
    },
}  


if (argv.geodb && fs.existsSync(argv.geodb)) config.geoip.file=argv.geodb

function maxmindOpen(geoipFile) {
    return new Promise((resolve,reject)=>{
        // open maxmind
        maxmind.open(geoipFile, (err, cl) => {
        if (err) {
            var line = `Error initializing ${geoipFile}`
            return reject(line)
        }
        debug(`${geoipFile} is opened successfully`)
        resolve(cl)
    });
    })
}


function validIp(ip) {
    return (ip.trim().search(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/)>=0)
}


function geoipLookup(ip) {
    if (geoip && validIp(ip)) {
        return geoip.get(ip)
    } 
    return false
}

function resolve4(host) {
	return new Promise((resolve,reject)=>{
      dns.resolve4(host,(err,addresses)=>{
          if (err) return reject(err)
          resolve(addresses)
      })  
    })
}


function canResolve4(host) {
	return new Promise((resolve,reject)=>{
      dns.resolve4(host,(err,addresses)=>{
          if (err) return resolve(false)
          resolve(true)
      })  
    })
}




async function bootstrap() {
    try {
        // geoip file is required
        if (!fs.existsSync(config.geoip.file)) {
            console.error(`Geoip file ${config.geoip.file} is missing`)
            process.exit(1)
        }
        // resolve host
        // if multiple ips we will take first one (for now)
        var tmp = await canResolve4(host)
        if (tmp) host=await resolve4(host)
        if (typeof host==='object') host=host[0]
        console.log(`Looking up`,chalk.blue(host))
    
        geoip = await maxmindOpen(config.geoip.file)
        debug(`Geoip init successfully`)
        var info = geoipLookup(host)
        if (!info) {
            console.error(`No information about ${host}`)
            process.exit(1)
        }
        debug(info)
        // county information
        if (info.hasOwnProperty('country')) 
            console.log(chalk.bold(`country:`),info.country.iso_code+`(${info.country.names.en})`)
        if (info.hasOwnProperty('continent')) 
            console.log(chalk.bold(`continent:`),info.continent.code+`(${info.continent.names.en})`)    
        // registered_country
        if (info.hasOwnProperty('registered_country')) 
            console.log(chalk.bold(`registered_country:`),info.registered_country.iso_code+`(${info.registered_country.names.en})`)        

        

        process.exit(0)
    }
    catch(err) {
        console.log(`could not open geoipfile`,err)
    }
}

if (argv._.length===0) {
    console.log(`Usage: node geoip2lookup.js <ip/host>`)
    process.exit(0)
}

var host = argv._[0]

bootstrap()