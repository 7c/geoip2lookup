const fs = require('fs')
const path = require('path')

function Geoip2Paths() {
    function firstExisting(paths) {
        if (Array.isArray(paths))
            for(let fpath of paths)
                if (fs.existsSync(fpath)) return fpath
        return false
    }

    return {
        country:firstExisting(['/opt/geoip2/GeoIP2-Country.mmdb','/usr/local/var/GeoIP/GeoIP2-Country.mmdb','/var/lib/GeoIP/GeoIP2-Country.mmdb','/usr/share/GeoIP/GeoIP2-Country.mmdb',path.join(__dirname, 'assets/GeoIP2-Country.mmdb')]),
        city:firstExisting(['/opt/geoip2/GeoIP2-City.mmdb','/usr/local/var/GeoIP/GeoIP2-City.mmdb','/var/lib/GeoIP/GeoIP2-City.mmdb','/usr/share/GeoIP/GeoIP2-City.mmdb',path.join(__dirname, 'assets/GeoIP2-City.mmdb')]),
        isp:firstExisting(['/opt/geoip2/GeoIP2-ISP.mmdb','/usr/local/var/GeoIP/GeoIP2-ISP.mmdb','/var/lib/GeoIP/GeoIP2-ISP.mmdb','/usr/share/GeoIP/GeoIP2-ISP.mmdb',path.join(__dirname, 'assets/GeoIP2-ISP.mmdb')]),
        ct:firstExisting(['/opt/geoip2/GeoIP2-Connection-Type.mmdb','/usr/local/var/GeoIP/GeoIP2-Connection-Type.mmdb','/var/lib/GeoIP/GeoIP2-Connection-Type.mmdb','/usr/share/GeoIP/GeoIP2-Connection-Type.mmdb',path.join(__dirname, 'assets/GeoIP2-Connection-Type.mmdb')]),
    }
}


module.exports = { 
    Geoip2Paths
}