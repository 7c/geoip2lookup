#!/usr/bin/env node
const MaxmindReader = require('@maxmind/geoip2-node').Reader;
const net = require('net')
var chalk = require('chalk')
var dns = require('dns');
var argv = require('minimist')(process.argv.splice(2))
var debug = require('debug')('geoip2lookup')
var path = require('path')
var fs = require('fs')
const { Geoip2Paths } = require('./shared')


const config = {
    geoip: Geoip2Paths()
}


if (argv.geodb && fs.existsSync(argv.geodb)) config.geoip.file = argv.geodb

function maxmindOpen(geoipFile) {
    return new Promise((resolve,reject)=>{       
        MaxmindReader.open(geoipFile, { watchForUpdates:true })
        .then(reader=>{
            debug(`${geoipFile} is opened successfully`)
            resolve(reader)
        })
        .catch(err=>{
            debug(`maxmindOpen Error at ${geoipFile}`,err)
            return reject(err)
        })
    })
}

function validIp(ip) {
    return (ip.trim().search(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/) >= 0)
}

function getCountryCode(reader,ip) {
    try {
        if (reader && ip && ip.search(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/)===0) {
            var c = reader.country(ip);
            if (c.hasOwnProperty('country') && c.country.hasOwnProperty('isoCode')) return c.country.isoCode;
        } 
    }catch(err) {
        console.log(err)
    }
    return '-'
}


function resolveDNS(host) {
    return new Promise((resolve, reject) => {
        dns.lookup(host, {all:true}, (err, addresses) => {
            if (err) {
                console.log(err)
                return resolve(false)
            }
            resolve(addresses)
        })
    })
}

async function doLookup(ip) {
    let geoip = await maxmindOpen(config.geoip.country)
    console.log(chalk.yellow(`[${ip}]`))
    debug(`Geoip init successfully`)
    let info = geoip.country(ip)
    debug(info)
    if (!info) {
        console.log(chalk.red(`No information about ${ip}`))
        return
    }
    if (net.isIPv6(ip)) {
        // console.log(info)
        // process.exit(0)
    }
    // console.log(info)
    if (info?.hasOwnProperty('country') && info?.country?.hasOwnProperty('isoCode')) 
        console.log(chalk.blue(`country:`), info.country.isoCode + `(${info.country.names.en})`)
    else {
        console.log(chalk.blue(`country:`), 'unknown')
    }
    if (info?.hasOwnProperty('continent') && info?.continent?.hasOwnProperty('code'))
        console.log(chalk.blue(`continent:`), info.continent.code + `(${info.continent.names.en})`)
    else {
        console.log(chalk.blue(`continent:`), 'unknown')
    }
    if (info?.hasOwnProperty('registeredCountry') && info?.registeredCountry?.hasOwnProperty('isoCode')) 
        console.log(chalk.blue(`registeredCountry:`), info.registeredCountry.isoCode + `(${info.registeredCountry.names.en})`)
    if (info?.traits){
        let traits = []
        for(let k of Object.keys(info.traits)) 
            if (info?.traits[k] && info.traits[k]===true) traits.push(k)
        if (traits.length>0) 
            console.log(chalk.blue(`traits:`), traits.join(','))
    }


}


async function bootstrap() {
    try {
        if (!fs.existsSync(config.geoip.country)) {
            console.error(`Geoip file ${config.geoip.country} is missing`)
            process.exit(1)
        }

        if (!host || host.length === 0) {
            console.error(`Usage: please provide ip or host`)
            process.exit(1)
        }

        let ips = []
        // resolve host
        // if multiple ips we will take first one (for now)
        if (net.isIP(host)) {
            ips.push(host)
        } else {
            let got = await resolveDNS(host)
            if (got.length === 0 || !got) {
                console.error(`Could not resolve ${host}`)
                process.exit(1)
            }
            ips = got.map(row=>row.address)
        }

        // process ips
        for (let ip of ips) 
            await doLookup(ip)
        
    }
    catch (err) {
        console.log(err)
    }
    process.exit(0)
}

if (argv._.length === 0) {
    console.log(`Usage: node geoip2lookup.js <ip/host>`)
    process.exit(0)
}

var host = argv._[0]

bootstrap()