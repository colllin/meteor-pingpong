Meteor.subscribe('allUsers');

Meteor.subscribe('matches');

WinCounts = new Meteor.Collection('win-counts');
// Meteor.subscribe('wins-by-user');
Deps.autorun(function() {
  Meteor.subscribe('wins-by-user');
});

