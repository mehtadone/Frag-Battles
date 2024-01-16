const fs = require("fs");
const readline = require("readline");

class FragranceTournament {
  constructor() {
    this.categories = ["SD", "SE", "WD", "WE"];
    this.entrants = this.readData();
    this.results = this.readResults();
  }

  readData() {
    const data = JSON.parse(fs.readFileSync("data.json"));
    return data.entrants;
  }

  readResults() {
    try {
      const results = JSON.parse(fs.readFileSync("results.json"));
      return results;
    } catch (err) {
      return [];
    }
  }

  writeResults() {
    fs.writeFileSync("results.json", JSON.stringify(this.results));
  }

  getCombinationPairs(category) {
    const fragrances = this.entrants[category];
    const pairs = [];
    for (let i = 0; i < fragrances.length; i++) {
      for (let j = i + 1; j < fragrances.length; j++) {
        pairs.push([fragrances[i], fragrances[j]]);
      }
    }
    return pairs;
  }

  showStandings() {
    const standings = {};
    this.results.forEach(result => {
      const category = result.category;
      if (!standings[category]) {
        standings[category] = {};
      }
      const winner = result.winner;
      if (!standings[category][winner]) {
        standings[category][winner] = 0;
      }
      standings[category][winner]++;
    });
    Object.keys(standings).forEach(category => {
      console.log(`\nCategory: ${category}`);
      const categoryStandings = standings[category];
      const sortedStandings = Object.keys(categoryStandings).sort((a, b) => categoryStandings[b] - categoryStandings[a]);
      let rank = 1;
      sortedStandings.forEach(winner => {
        let color = '';
        if (rank === 1) {
          color = '\x1b[33m'; // yellow
        } else if (rank === 2) {
          color = '\x1b[34m'; // blue
        } else if (rank === 3) {
          color = '\x1b[32m'; // green
        }
        console.log(`  ${color}${rank}. ${winner}: ${categoryStandings[winner]}\x1b[0m`);
        rank++;
      });
    });
  }

  filterResults(pairs, category) {
    const filteredPairs = pairs.filter((pair) => {
      const [fragrance1, fragrance2] = pair;
      const result = this.results.find(
        (result) =>
          result.category === category &&
          ((result.entrants[0] === fragrance1 &&
            result.entrants[1] === fragrance2) ||
            (result.entrants[0] === fragrance2 &&
              result.entrants[1] === fragrance1))
      );
      return !result;
    });
    return filteredPairs;
  }

  getBattles() {
    const battles = [];
    this.categories.forEach((category) => {
      const pairs = this.getCombinationPairs(category);
      const filteredPairs = this.filterResults(pairs, category);
      battles.push(
        ...filteredPairs.slice(0, 5).map((pair) => [pair, category])
      );
    });
    return battles;
  }

  showHistory() {
    const resultsByCategory = {};
    this.results.forEach(result => {
      const category = result.category;
      if (!resultsByCategory[category]) {
        resultsByCategory[category] = [];
      }
      resultsByCategory[category].push(result);
    });
    Object.keys(resultsByCategory).forEach(category => {
      console.log(`\nCategory: ${category}`);
      resultsByCategory[category].forEach(result => {
        console.log(
          `  \x1b[32m${result.winner}\x1b[0m vs ${result.entrants.find(
            entrant => entrant !== result.winner
          )}`
        );
      });
    });
  }

  showBattles() {
    const battles = this.getBattles();
    const battlesByCategory = {};
    battles.forEach((battle) => {
      const category = battle[1];
      if (!battlesByCategory[category]) {
        battlesByCategory[category] = [];
      }
      battlesByCategory[category].push(battle);
    });
    let battleNumber = 1;
    Object.keys(battlesByCategory).forEach((category) => {
      console.log(`Category: ${category}`);
      battlesByCategory[category].forEach((battle) => {
        console.log(`  ${battleNumber}. ${battle[0][0]} vs ${battle[0][1]}`);
        battleNumber++;
      });
    });
    return battles;
  }

  prompt(rl, loop) {
    const battles = this.showBattles();
    rl.question("Enter battle number: ", (battleNumber) => {
      const battle = battles[parseInt(battleNumber) - 1];
      if (!battle) {
        console.log(
          "Invalid battle number. Please enter a valid battle number."
        );
        loop();
        return;
      }
      console.log(`1. ${battle[0][0]}`);
      console.log(`2. ${battle[0][1]}`);
      rl.question("Enter winner: ", (winnerNumber) => {
        const winner = battle[0][parseInt(winnerNumber) - 1];
        this.results.push({
          entrants: battle[0],
          winner,
          category: battle[1],
        });
        this.writeResults();
        this.prompt(rl, loop);
      });
    });
  }

  start() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const showMenu = () => {
      console.log("1. Show history");
      console.log("2. Enter result");
      console.log("3. Show standings");
      console.log("4. Exit");
    };

    const loop = () => {
      showMenu();
      rl.question("Enter option: ", (option) => {
        if (option === "1") {
          this.showHistory();
          loop();
        } else if (option === "2") {
          this.prompt(rl, loop);
        } else if (option === "3") {
          this.showStandings();
          loop();
        } else if (option === "4") {
          rl.close();
        } else {
          loop();
        }
      });
    };

    loop();
  }
}

const tournament = new FragranceTournament();
tournament.start();
