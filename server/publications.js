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
		monthWinRatio: 1,
		points: 0,
		yearPoints: 0,
		quarterPoints: 0,
		monthPoints: 0,
		pointsAgainst: 0,
		yearPointsAgainst: 0,
		quarterPointsAgainst: 0,
		monthPointsAgainst: 0
	};

	var updateWinRatios = function(aggregation) {
		aggregation.winRatio = aggregation.wins / aggregation.losses;
		aggregation.yearWinRatio = aggregation.yearWins / aggregation.yearLosses;
		aggregation.quarterWinRatio = aggregation.quarterWins / aggregation.quarterLosses;
		aggregation.monthWinRatio = aggregation.monthWins / aggregation.monthLosses;
	};

	var addWin = _.bind(function(document) {
		var aggregation = _(userStats).findWhere({_id: document.winner_id});
		var isNewAggregation = false;

		if (!aggregation) {
			isNewAggregation = true;
			aggregation = _.extend({
				_id: document.winner_id,
			}, defaultAggregation);
			userStats.push(aggregation);
		}

		if (aMonthAgo.isBefore(document.date)) {
			aggregation.monthWins++;
			aggregation.quarterWins++;
			aggregation.yearWins++;

			aggregation.monthPoints += document.winner_score;
			aggregation.quarterPoints += document.winner_score;
			aggregation.yearPoints += document.winner_score;

			aggregation.monthPointsAgainst += document.loser_score;
			aggregation.quarterPointsAgainst += document.loser_score;
			aggregation.yearPointsAgainst += document.loser_score;
		} else if (aQuarterAgo.isBefore(document.date)) {
			aggregation.quarterWins++;
			aggregation.yearWins++;

			aggregation.quarterPoints += document.winner_score;
			aggregation.yearPoints += document.winner_score;

			aggregation.quarterPointsAgainst += document.loser_score;
			aggregation.yearPointsAgainst += document.loser_score;
		} else if (aYearAgo.isBefore(document.date)) {
			aggregation.yearWins++;

			aggregation.yearPoints += document.winner_score;

			aggregation.yearPointsAgainst += document.loser_score;
		}
		aggregation.wins++;
		aggregation.points += document.winner_score;
		aggregation.pointsAgainst += document.loser_score;

		updateWinRatios(aggregation);

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

			existingAggregation.monthPoints -= document.winner_score;
			existingAggregation.quarterPoints -= document.winner_score;
			existingAggregation.yearPoints -= document.winner_score;

			existingAggregation.monthPointsAgainst -= document.loser_score;
			existingAggregation.quarterPointsAgainst -= document.loser_score;
			existingAggregation.yearPointsAgainst -= document.loser_score;
		} else if (aQuarterAgo.isBefore(document.date)) {
			existingAggregation.quarterWins--;
			existingAggregation.yearWins--;

			existingAggregation.quarterPoints -= document.winner_score;
			existingAggregation.yearPoints -= document.winner_score;

			existingAggregation.quarterPointsAgainst -= document.loser_score;
			existingAggregation.yearPointsAgainst -= document.loser_score;
		} else if (aYearAgo.isBefore(document.date)) {
			existingAggregation.yearWins--;
			existingAggregation.yearPoints -= document.winner_score;
			existingAggregation.yearPointsAgainst -= document.loser_score;
		}
		existingAggregation.wins--;
		existingAggregation.points -= document.winner_score;
		existingAggregation.pointsAgainst -= document.loser_score;

		updateWinRatios(existingAggregation);

		this.changed('users', existingAggregation._id, existingAggregation);
	}, this);

	var addLoss = _.bind(function(document) {
		var aggregation = _(userStats).findWhere({_id: document.loser_id});
		var isNewAggregation = false;

		if (!aggregation) {
			isNewAggregation = true;
			aggregation = _.extend({
				_id: document.loser_id,
			}, defaultAggregation);
			userStats.push(aggregation);
		}

		if (aMonthAgo.isBefore(document.date)) {
			aggregation.monthLosses++;
			aggregation.quarterLosses++;
			aggregation.yearLosses++;

			aggregation.monthPoints += document.loser_score;
			aggregation.quarterPoints += document.loser_score;
			aggregation.yearPoints += document.loser_score;

			aggregation.monthPointsAgainst += document.winner_score;
			aggregation.quarterPointsAgainst += document.winner_score;
			aggregation.yearPointsAgainst += document.winner_score;
		} else if (aQuarterAgo.isBefore(document.date)) {
			aggregation.quarterLosses++;
			aggregation.yearLosses++;

			aggregation.quarterPoints += document.loser_score;
			aggregation.yearPoints += document.loser_score;

			aggregation.quarterPointsAgainst += document.winner_score;
			aggregation.yearPointsAgainst += document.winner_score;
		} else if (aYearAgo.isBefore(document.date)) {
			aggregation.yearLosses++;
			aggregation.yearPoints += document.loser_score;
			aggregation.yearPointsAgainst += document.winner_score;
		}
		aggregation.losses++;
		aggregation.points += document.loser_score;
		aggregation.pointsAgainst += document.winner_score;

		updateWinRatios(aggregation);

		if (isNewAggregation) {
			this.added('users', aggregation._id, aggregation);
		} else {
			this.changed('users', aggregation._id, aggregation);
		}
	}, this);
	var subtractLoss = _.bind(function(document) {
		var existingAggregation = _(userStats).findWhere({_id: document.loser_id});

		if (!existingAggregation) {
			// do nothing
			// this probably indicates a bug if the code gets here
			return;
		}

		if (aMonthAgo.isBefore(document.date)) {
			existingAggregation.monthLosses--;
			existingAggregation.quarterLosses--;
			existingAggregation.yearLosses--;

			existingAggregation.monthPoints -= document.loser_score;
			existingAggregation.quarterPoints -= document.loser_score;
			existingAggregation.yearPoints -= document.loser_score;

			existingAggregation.monthPointsAgainst -= document.winner_score;
			existingAggregation.quarterPointsAgainst -= document.winner_score;
			existingAggregation.yearPointsAgainst -= document.winner_score;
		} else if (aQuarterAgo.isBefore(document.date)) {
			existingAggregation.quarterLosses--;
			existingAggregation.yearLosses--;

			existingAggregation.quarterPoints -= document.loser_score;
			existingAggregation.yearPoints -= document.loser_score;

			existingAggregation.quarterPointsAgainst -= document.winner_score;
			existingAggregation.yearPointsAgainst -= document.winner_score;
		} else if (aYearAgo.isBefore(document.date)) {
			existingAggregation.yearLosses--;
			existingAggregation.yearPoints -= document.loser_score;
			existingAggregation.yearPointsAgainst -= document.winner_score;
		}
		existingAggregation.losses--;
		existingAggregation.points -= document.loser_score;
		existingAggregation.pointsAgainst -= document.winner_score;

		updateWinRatios(existingAggregation);

		this.changed('users', existingAggregation._id, existingAggregation);
	}, this);

	// wins depend on matches, so observe changes to the matches collection
    var liveQuery = Matches.find({}).observe({
		added: function(document) {
			addWin(document);
			addLoss(document);
		},
		changed: function(newDocument, oldDocument) {
			var changed = function(prop) {
				return newDocument[prop] != oldDocument[prop];
			};

			if (changed('winner_id') || changed('date')) {
				subtractWin(oldDocument);
				addWin(newDocument);
			}
			if (changed('loser_id') || changed('date')) {
				subtractLoss(oldDocument);
				addLoss(newDocument);
			}
		},
		removed: function(document) {
			subtractWin(document);
			subtractLoss(document);
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

