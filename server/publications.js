Meteor.publish('allUsers', function () {
	// return Meteor.users.find({}, {fields: {emails: 1, profile: 1}});
	return Meteor.users.find({});
});

Meteor.publish('matches', function() {
	return Matches.find({
		confirmed: 1
	});
});

Meteor.publish('unconfirmedMatches', function() {
	return Matches.find({
		$or: [{
			winner_id: this.userId,
			confirmed: 0
		}, {
			loser_id: this.userId,
			confirmed: 0
		}, {
			winner_id: this.userId,
			confirmed: {$exists: false}
		}, {
			loser_id: this.userId,
			confirmed: {$exists: false}
		}, {
			creator_id: this.userId,
			confirmed: -1
		}]
	});
});

Meteor.publish('user-stats', function() {
	// var self = this;
	// check(roomId, String);
	var initializing = true;
	// var aggregationQuery = [{
 //        $group: {
 //            _id: '$winner_id',
 //            wins: {$sum: 1}
 //        }
 //    }];
    // , {
    //     $sort: {
    //     	wins: -1
    //     }
    // }];

	// var userStats = Matches.aggregate(aggregationQuery);
	// _(userStats).each(_.bind(function(aggregation) {
	// 	this.added('win-counts', aggregation._id, aggregation);
	// }, this));
	// initializing = false;
	// this.ready();

	var userStats = [];
	var aYearAgo = moment().utc().subtract({years: 1});
	var aQuarterAgo = moment().utc().subtract({months: 3});
	var aMonthAgo = moment().utc().subtract({months: 1});

	var defaultAggregation = {
		wins: 0,
		yearWins: 0,
		quarterWins: 0,
		monthWins: 0,
		losses: 0,
		yearLosses: 0,
		quarterLosses: 0,
		monthLosses: 0,
		winRatio: 1,
		yearWinRatio: 1,
		quarterWinRatio: 1,
		monthWinRatio: 1
	};

	var addWin = _.bind(function(document) {
		var aggregation = _(userStats).findWhere({_id: document.winner_id});
		var isNewAggregation = false;

		if (!aggregation) {
			isNewAggregation = true;
			aggregation = {
				_id: document.winner_id,
				wins: 0,
				yearWins: 0,
				quarterWins: 0,
				monthWins: 0
			};
			userStats.push(aggregation);
		}

		if (aMonthAgo.isBefore(document.date)) {
			aggregation.monthWins++;
			aggregation.quarterWins++;
			aggregation.yearWins++;
		} else if (aQuarterAgo.isBefore(document.date)) {
			aggregation.quarterWins++;
			aggregation.yearWins++;
		} else if (aYearAgo.isBefore(document.date)) {
			aggregation.yearWins++;
		}
		aggregation.wins++;

		if (isNewAggregation) {
			this.added('users', aggregation._id, aggregation);
		} else {
			this.changed('users', aggregation._id, aggregation);
		}
	}, this);
	var subtractWin = _.bind(function(document) {
		var existingAggregation = _(userStats).findWhere({_id: document.winner_id});

		if (!existingAggregation) {
			// do nothing
			// this probably indicates a bug if the code gets here
			return;
		}

		if (aMonthAgo.isBefore(document.date)) {
			existingAggregation.monthWins--;
			existingAggregation.quarterWins--;
			existingAggregation.yearWins--;
		} else if (aQuarterAgo.isBefore(document.date)) {
			existingAggregation.quarterWins--;
			existingAggregation.yearWins--;
		} else if (aYearAgo.isBefore(document.date)) {
			existingAggregation.yearWins--;
		}
		existingAggregation.wins--;

		this.changed('users', existingAggregation._id, existingAggregation);
	}, this);

	// wins depend on matches, so observe changes to the matches collection
    var liveQuery = Matches.find({}).observe({
		added: function(document) {
			addWin(document);
		},
		changed: function(newDocument, oldDocument) {
			var changed = function(prop) {
				return newDocument[prop] != oldDocument[prop];
			};

			if (changed('winner_id') || changed('date')) {
				subtractWin(oldDocument);
				addWin(newDocument);
			}
		},
		removed: function(document) {
			subtractWin(document);
		}
	});

	// Observe only returns after the initial added callbacks have
	// run.  Now mark the subscription as ready.
	initializing = false;
	this.ready();

	// Stop observing the cursor when client unsubs.
	// Stopping a subscription automatically takes
	// care of sending the client any removed messages.
	this.onStop(function () {
		liveQuery.stop();
	});
});

