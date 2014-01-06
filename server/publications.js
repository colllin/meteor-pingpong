Meteor.publish('allUsers', function () {
	// return Meteor.users.find({}, {fields: {emails: 1, profile: 1}});
	return Meteor.users.find({});
});

Meteor.publish('matches', function() {
	return Matches.find({});
});

Meteor.publish('wins-by-user', function() {
	// var self = this;
	// check(roomId, String);
	var initializing = true;
	var aggregationQuery = [{
        $group: {
            _id: '$winner_id',
            wins: {$sum: 1}
        }
    }];
    // , {
    //     $sort: {
    //     	wins: -1
    //     }
    // }];

	// var matchWinsByUser = Matches.aggregate(aggregationQuery);
	// _(matchWinsByUser).each(_.bind(function(aggregation) {
	// 	this.added('win-counts', aggregation._id, aggregation);
	// }, this));
	// initializing = false;
	// this.ready();

	var matchWinsByUser = [];

	var addWin = _.bind(function(document) {
		var existingAggregation = _(matchWinsByUser).findWhere({_id: document.winner_id});

		if (existingAggregation) {

			existingAggregation.wins++;
			this.changed('win-counts', existingAggregation._id, existingAggregation);

		} else {

			var newAggregation = {_id: document.winner_id, wins: 1};
			matchWinsByUser.push(newAggregation);
			this.added('win-counts', newAggregation._id, newAggregation);

		}
	}, this);
	var subtractWin = _.bind(function(document) {
		var existingAggregation = _(matchWinsByUser).findWhere({_id: document.winner_id});

		if (existingAggregation) {

			existingAggregation.wins--;
			this.changed('win-counts', existingAggregation._id, existingAggregation);

		} else {

			// do nothing
			// this probably indicates a bug if the code gets here

		}
	}, this);

	// wins depend on matches, so observe changes to the matches collection
    var handle = Matches.find({}).observe({
		// addedAt: _.bind(function(document, atIndex, before) {
		// 	usersByWins.splice(atIndex, 0, document);
		// 	this.added('win-counts', document._id, document);
		// }, this),
		added: function(document) {
			// aggregation = Matches.aggregate();
			addWin(document);
		},
		// changedAt: function(newDocument, oldDocument, atIndex) {
		// 	this.changed('win-counts', , );
		// },
		changed: function(newDocument, oldDocument) {
			if (newDocument.winner_id == oldDocument.winner_id) return;

			subtractWin(oldDocument);
			addWin(newDocument);
		},
		// removedAt: _.bind(function(document, atIndex) {
		// 	// usersByWins.splice(atIndex, 1);
		// 	this.removed('win-counts', document._id);
		// }, this),
		removed: function(document) {
			subtractWin(document);
		}
		// movedTo: function(document, fromIndex, toIndex, before) {
		// }
	});

	// Observe only returns after the initial added callbacks have
	// run.  Now mark the subscription as ready.
	initializing = false;
	this.ready();

	// Stop observing the cursor when client unsubs.
	// Stopping a subscription automatically takes
	// care of sending the client any removed messages.
	this.onStop(function () {
		handle.stop();
	});
});

