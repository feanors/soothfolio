const https = require("https");

const urlAllCoins = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=7d";

function coinDefault(id, name, price, image) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.image = image;
}

exports.getAllCoinData = (allCoinz, priceOnly) => { 

    requestParser(urlAllCoins, (parsedData) => {
        for (var i = 0; i < parsedData.length; i++) {

            let id = parsedData[i].id;
            let price = parsedData[i].current_price;

            if(priceOnly && allCoinz.has(id)) {
                allCoinz.get(id).price = price;
                
            } else {
                let name = parsedData[i].name;
                let image = parsedData[i].image;
                allCoinz.set(id, new coinDefault(id, name, price, image));
            }
        }
    });    
}

function requestParser(url, callback) {
    var parsedData;
    https.get(url, (res) => {

        let body = "";
    
        res.on("data", (data) => {
            body += data;
        });
    
        res.on("end", () => {
            parsedData = JSON.parse(body);
            callback(parsedData);
        });
        
    });
}


exports.getPriceOnDate = (id, date, callback) => {
    let currPriceURL = "https://api.coingecko.com/api/v3/coins/" + id + "/history?date=" + date + "&localization=false";
    requestParser(currPriceURL, (parsedData) => {
        if(parsedData.market_data) {
            callback(parsedData.market_data.current_price.usd);
        } else {
            callback(null)
        }
    });
}