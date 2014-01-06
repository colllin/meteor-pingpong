Accounts.config({
    sendVerificationEmail: true,
    loginExpirationInDays: null
});

Meteor.startup(function () {
    // if (Matches.find().count() === 0) {
    //     var names = ["Ada Lovelace",
    //                  "Grace Hopper",
    //                  "Marie Curie",
    //                  "Carl Friedrich Gauss",
    //                  "Nikola Tesla",
    //                  "Claude Shannon"];
    //     for (var i = 0; i < 10; i++) {
    //         createMatch({
    //             winner: names[Math.round(Random.fraction()*5)],
    //             loser: names[Math.round(Random.fraction()*5)],
    //             winner_score: 21,
    //             loser_score: Math.round(Random.fraction()*20)
    //         });
    //     }
    // }

    // SortOptions.upsert({
    //     name: 'name'
    // }, {
    //     $set: {
    //         name: 'name',
    //         sort: {name: 1, score: -1}
    //     }
    // });
    // SortOptions.upsert({
    //     name: 'score'
    // }, {
    //     $set: {
    //         name: 'score',
    //         sort: {score: -1, name: 1}
    //     }
    // });
    // SortOptions.upsert({
    //     name: 'golf'
    // }, {
    //     $set: {
    //         name: 'golf',
    //         sort: {score: 1, name: 1}
    //     }
    // });

});
