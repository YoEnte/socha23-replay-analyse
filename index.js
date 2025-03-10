const path = require('path');
const fs = require('fs');
const xmlReader = require('xml-reader');
const xmlQuery = require('xml-query');

const directoryPath = 'C:\\Users\\antho\\OneDrive\\.Coding\\Wettbewerbe\\Software_Challenge\\22-23\\stuff\\software-challenge-server\\replays';
const logEveryMatch = false;
const logProgress = true;
const logProgressNumber = 10;
const logProgressClear = true;
const summarizeTimeStart = Date.now();

fs.readdir(directoryPath, (err, files) => {

    // handle errors
    if (err) {
        return console.log('dir scan abort:', err);
    }

    //console.log(`found ${files.length} files:`)

    var data = {
        ONE: {
            winCodes: [],
            fishPerGame: [],
            causes: [],
            reasons: [],
        },
        TWO: {
            winCodes: [],
            fishPerGame: [],
            causes: [],
            reasons: [],
        },
        GEN: {
            matches: files.length,
            moves: [],
        }
    };

    // loop through all files
    files.forEach((file, f) => {

        // xml stuff (https://www.npmjs.com/package/xml-query)
        const xml = fs.readFileSync(path.join(directoryPath, file)).toString();
        const ast = xmlReader.parseSync(xml);
        const xq = xmlQuery(ast);
        
        // get all moves for moveCount
        var moves = xq.find('lastMove').ast; // check
        data.GEN.moves.push(moves.length);
        
        // player and score tags
        var players = xq.find('player').ast;
        var scores = xq.find('score').ast;
        
        // loop tru both player tags, get team str
        players.forEach((player, i) => {
            var team = player.attributes.team;

            // parts of player's score
            var parts = scores[i].children;

            // save part data
            parts.forEach((part, j) => {
                if (j == 0) {   // win exit code
                    data[team].winCodes.push(parseInt(part.children[0].value));
                } else if (j == 1) {    // fish
                    data[team].fishPerGame.push(parseInt(part.children[0].value));
                }
            });
            
            // add causes and reasons
            data[team].causes.push(scores[i].attributes.cause);
            data[team].reasons.push(scores[i].attributes.reason);
        });

        // log each game/progress:
        if (logProgress && f % logProgressNumber == 0) {
            var barPercent = Math.round((f / files.length * 100) * 100) / 100;
            var barFill = '';
            var barFillLength = 10;
            var barFull = '';
            var barEmpty = '';
            var barLength = 80;
            
            // add empty space
            for (var i = 0; i < barFillLength - barPercent.toString().length; i++) {
                barFill += ' ';
            }
            
            // add progress bar
            for (var i = 0; i < barLength; i++) {
                if (Math.floor(i / barLength * 100) < barPercent) {
                    barFull  += '█';
                } else {
                    barEmpty += '░';
                }
            }

            // log everything above
            if (logProgressClear) {
                console.clear();
            }

            console.log(`Progress: ${barPercent}%${barFill}${barFull}${barEmpty}`);
        }

        if (logEveryMatch) {
            console.log(`GAME ${f + 1}: ${file}`);
            console.log(`GENERAL: moves: ${data.GEN.moves[f]}`);
            console.log(`TEAM ONE: win code: ${data.ONE.winCodes[f]}, fish: ${data.ONE.fishPerGame[f]}, exits: ${data.ONE.causes[f]}, reasons: ${data.ONE.reasons[f]}`);
            console.log(`TEAM TWO: win code: ${data.TWO.winCodes[f]}, fish: ${data.TWO.fishPerGame[f]}, exits: ${data.TWO.causes[f]}, reasons: ${data.TWO.reasons[f]}`);
            console.log("");
        }
    });

    // calc totals for overview
    const summarizeTime = Date.now() - summarizeTimeStart;
    const summarizeTimeMin = Math.floor(summarizeTime / 60000);
    const summarizeTimeSec = ((summarizeTime % 60000) / 1000).toFixed(0);

    data.ONE.totalWinCodes = data.ONE.winCodes.reduce((accumulator, value) => {return {...accumulator, [value]: (accumulator[value] || 0) + 1}}, {});
    data.ONE.totalFish = data.ONE.fishPerGame.reduce((a, b) => a + b, 0);
    data.ONE.totalCauses = data.ONE.causes.reduce((accumulator, value) => {return {...accumulator, [value]: (accumulator[value] || 0) + 1}}, {});
    data.ONE.totalReasons = data.ONE.reasons.reduce((accumulator, value) => {return {...accumulator, [value]: (accumulator[value] || 0) + 1}}, {});

    data.TWO.totalWinCodes = data.TWO.winCodes.reduce((accumulator, value) => {return {...accumulator, [value]: (accumulator[value] || 0) + 1}}, {});
    data.TWO.totalFish = data.TWO.fishPerGame.reduce((a, b) => a + b, 0);
    data.TWO.totalCauses = data.TWO.causes.reduce((accumulator, value) => {return {...accumulator, [value]: (accumulator[value] || 0) + 1}}, {});
    data.TWO.totalReasons = data.TWO.reasons.reduce((accumulator, value) => {return {...accumulator, [value]: (accumulator[value] || 0) + 1}}, {});

    data.GEN.totalMoves = data.GEN.moves.reduce((a, b) => a + b, 0);
    data.GEN.totalMatchFish = data.ONE.totalFish + data.TWO.totalFish;

    // log overview
    console.log('\n/////////////   OVERVIEW   /////////////\n');

    console.log('\nPROCESS DATA:');
    console.log(`summarize time: ${summarizeTimeSec == 60 ? (summarizeTimeMin + 1) + ":00" : summarizeTimeMin + ":" + (summarizeTimeSec < 10 ? "0" : "") + summarizeTimeSec}`);

    console.log('\nMATCH DATA:');
    console.log(`played matches: ${data.GEN.matches}`);
    console.log(`total matches moves: ${data.GEN.totalMoves} || average moves per match: ${Math.round((data.GEN.totalMoves / data.GEN.matches) * 100) / 100}`);
    console.log(`total matches fish: ${data.GEN.totalMatchFish}`);

    console.log('\nTEAM ONE:');
    Object.keys(data.ONE.totalWinCodes).forEach((code, i) => {console.log(`win code '${code}' (${(code == '2') ? "win" : (code == '1') ? "tie" : "lost"}): ${data.ONE.totalWinCodes[code]} => ${Math.round((data.ONE.totalWinCodes[code] / data.GEN.matches * 100) * 100) / 100}%`)});
    console.log(`total fish: ${data.ONE.totalFish} || average fish per match: ${Math.round((data.ONE.totalFish / data.GEN.matches) * 100) / 100} => ${Math.round((data.ONE.totalFish / data.GEN.totalMatchFish * 100) * 100) / 100}%`);
    Object.keys(data.ONE.totalCauses).forEach((cause, i) => {console.log(`cause for exit '${cause}': ${data.ONE.totalCauses[cause]} => ${Math.round((data.ONE.totalCauses[cause] / data.GEN.matches * 100) * 100) / 100}%`)});
    Object.keys(data.ONE.totalReasons).forEach((reason, i) => {console.log(`reason for exit '${reason}': ${data.ONE.totalReasons[reason]} => ${Math.round((data.ONE.totalReasons[reason] / data.GEN.matches * 100) * 100) / 100}%`)});

    console.log('\nTEAM TWO:');
    Object.keys(data.TWO.totalWinCodes).forEach((code, i) => {console.log(`win code '${code}' (${(code == '2') ? "win" : (code == '1') ? "tie" : "lost"}): ${data.TWO.totalWinCodes[code]} => ${Math.round((data.TWO.totalWinCodes[code] / data.GEN.matches * 100) * 100) / 100}%`)});
    console.log(`total fish: ${data.TWO.totalFish} || average fish per match: ${Math.round((data.TWO.totalFish / data.GEN.matches) * 100) / 100} => ${Math.round((data.TWO.totalFish / data.GEN.totalMatchFish * 100) * 100) / 100}%`);
    Object.keys(data.TWO.totalCauses).forEach((cause, i) => {console.log(`cause for exit '${cause}': ${data.TWO.totalCauses[cause]} => ${Math.round((data.TWO.totalCauses[cause] / data.GEN.matches * 100) * 100) / 100}%`)});
    Object.keys(data.TWO.totalReasons).forEach((reason, i) => {console.log(`reason for exit '${reason}': ${data.TWO.totalReasons[reason]} => ${Math.round((data.TWO.totalReasons[reason] / data.GEN.matches * 100) * 100) / 100}%`)});
});