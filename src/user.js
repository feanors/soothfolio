const ccData = require("./cc-api");
const cryptor = require("./cryptor");

function coinPersonalized(amount, pricePaid) {
    this.amount = amount,
    this.pricePaid = pricePaid;
}

exports.fetchUserCoinMap = async function(CoinSchema, userID, allCoinz, callback) {
    CoinSchema.findOne({buffer: userID}, (err, resp) => {
        let userCoinMap = new Map();
        
        if(resp) {
            object = { iv: resp.coinMap.iv, content: resp.coinMap.content };
            map = new Map(JSON.parse(cryptor.decrypt( object )));
            for (const [key, value] of map.entries()) { 
                userCoinMap.set(allCoinz.get(key), value);
            }
        }

        userCoinMap = new Map([...userCoinMap.entries()].sort((a, b) => b[0].price*b[1].amount - a[0].price*a[1].amount));
    
        callback(userCoinMap);
    });
}

function decreaseCoinByAmount(CoinSchema, resp, amnt, id, auther, callback) {
    let map = new Map(JSON.parse(cryptor.decrypt(resp.coinMap)));
    let coin = map.get(id);

    if(map.has(id)) { 
        coin.amount = coin.amount + amnt;
        if(coin.amount <= 0) {
            map.delete(id);
        }
    }

    ecd = cryptor.encrypt(JSON.stringify([...map.entries()]));
    CoinSchema.updateOne({buffer: auther}, {coinMap : ecd}, (err) => callback());
}

function increaseCoinByAmount(CoinSchema, resp, amnt, id, priceOnDate, auther, callback) {
    let map = new Map(JSON.parse(cryptor.decrypt(resp.coinMap)));
    let coin = map.get(id);

    if(map.has(id)) { 
        coin.pricePaid = ((coin.amount * coin.pricePaid) + (amnt * priceOnDate)) / (coin.amount + amnt);
        coin.amount = coin.amount + amnt;
    } else {
        map.set(id, new coinPersonalized(amnt, priceOnDate));
    }    

    ecd = cryptor.encrypt(JSON.stringify([...map.entries()]));
    CoinSchema.updateOne({buffer: auther}, {coinMap : ecd}, (err) => callback());
}

exports.updateCoinAmount = function(CoinSchema, amnt, id, date, auther, callback) {

    CoinSchema.findOne({buffer: auther}, (err, resp) => {

        if(resp) {
            if(date == null) {
                decreaseCoinByAmount(CoinSchema, resp, amnt, id, auther, callback);
            }else {
                ccData.getPriceOnDate(id, date, (priceOnDate) => {

                    if (priceOnDate != null) {
                        increaseCoinByAmount(CoinSchema, resp, amnt, id, priceOnDate, auther, callback);
                    } else {
                        callback();
                    }            
                });
            }  
        }
    });
}


exports.totalWorth = function (coinz) {

    let worth = 0;

    for (const [key, value] of coinz.entries()) {
        worth += key.price * value.amount;
    }

    return worth;
}

exports.totalGainz = function (coinz) {
    
    let spent = 0;
    
    for (const [key, value] of coinz.entries()) {
        spent += value.pricePaid * value.amount;
    }

    return exports.totalWorth(coinz) - spent;
}