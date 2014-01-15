Matches = new Meteor.Collection('matches');

Matches.allow({
    insert: function(userId, match) {
        return false; // no cowboy inserts -- use createMatch method
    },
    update: function(userId, match, fields, modifier) {
        if (userId !== match.winner && userId !== match.loser)
            return false;

        // var allowed = ['winner_score', 'loser_score'];
        // if (_.difference(fields, allowed).length)
        //     return false;

        return true;
    },
    remove: function(userId, match) {
        return false;
    }
});

// workaround https://github.com/meteor/meteor/issues/881
createMatch = function (options) {
    // different than _.extend()ing options, because if options._id is defined AS undefined, _.extend will take undefined as the resulting value
    if (!options._id || !options._id.length) options._id = Random.id();
    if (!options.date) options.date = moment().utc().toDate();

    return Meteor.call('createMatch', options);
};

Meteor.methods({
    // options should include: title, description, x, y, public
    createMatch: function (options) {
        // check(options, {
        //     title: NonEmptyString,
        //     description: NonEmptyString,
        //     x: Coordinate,
        //     y: Coordinate,
        //     public: Match.Optional(Boolean),
        //     _id: Match.Optional(NonEmptyString)
        // });

        if (!this.userId)
            throw new Meteor.Error(403, "You must be logged in");

        if (this.userId != options.winner_id && this.userId != options.loser_id)
            throw new Meteor.Error(403, "You can't create a match you didn't participate in.");

        if (!Meteor.users.findOne(options.winner_id))
            throw new Meteor.Error(422, "Winner not found in users database.");

        if (!Meteor.users.findOne(options.loser_id))
            throw new Meteor.Error(422, "Loser not found in users database.");

        if (options.winner_score < options.loser_score)
            throw new Meteor.Error(422, "Loser has more points than the winner? This is a bug. Contact your friendly developer.");

        if (options.winner_score > 100)
            throw new Meteor.Error(422, "Max game score is 100. Cheater.");

        if (options.loser_score > 100)
            throw new Meteor.Error(422, "Max game score is 100. Cheater.");

        if (options.winner_score < 0)
            throw new Meteor.Error(422, "Negative points defies the laws of physics.");

        if (options.loser_score < 0)
            throw new Meteor.Error(422, "Negative points defies the laws of physics.");

        return Matches.insert({
            _id: options._id,
            creator_id: this.userId,
            winner_id: options.winner_id,
            winner_score: options.winner_score,
            loser_id: options.loser_id,
            loser_score: options.loser_score,
            date: options.date
        });
    }
});
