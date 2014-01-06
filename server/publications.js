Meteor.publish('allUsers', function () {
	// return Meteor.users.find({}, {fields: {emails: 1, profile: 1}});
	return Meteor.users.find({});
});

Meteor.publish('matches', function() {
	return Matches.find({});
});
