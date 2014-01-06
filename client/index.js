Accounts.ui.config({
    passwordSignupFields: 'USERNAME_AND_EMAIL'
});

Router.configure({
    layoutTemplate: 'layout'
});

Session.setDefault('matchDraft', {});

Router.map(function() {
    /**
     * The route's name is "home"
     * The route's template is also "home"
     * The default action will render the home template
     */
    this.route('home', {
        path: '/',
        template: 'feed'
    });

    this.route('leaderboard', {
        path: '/leaderboard',
        template: 'leaderboard'
    });

    /**
     * The route's name is "posts"
     * The route's path is "/posts"
     * The route's template is inferred to be "posts"
     */
    this.route('newMatch', {
        path: '/new',
        template: 'newMatch'
    });

    this.route('newMatchOpponent', {
        path: '/new/opponent',
        template: 'selectUser',
        data: {
            allowSelf: false,
            allowInvite: true,
            done: function(selectedUser) {
                Session.set('matchDraft', _.extend(Session.get('matchDraft'), {opponent: selectedUser}))
                Router.go('newMatch');
            },
            fail: function() {
                Router.go('newMatch');
            }
        }
    });

    // this.route('post', {
    //     path: '/posts/:_id',

    //     load: function() {
    //         // called on first load
    //     },

    //     // before hooks are run before your action
    //     before: [
    //         function() {
    //             this.subscribe('post', this.params._id).wait();
    //             this.subscribe('posts'); // don't wait
    //         },

    //         function() {
    //             // we're done waiting on all subs
    //             if (this.ready()) {
    //                 NProgress.done(); 
    //             } else {
    //                 NProgress.start();
    //                 this.stop(); // stop downstream funcs from running
    //             }
    //         }
    //     ],

    //     action: function() {
    //         var params = this.params; // including query params
    //         var hash = this.hash;
    //         var isFirstRun = this.isFirstRun;

    //         this.render(); // render all
    //         this.render('specificTemplate', {to: 'namedYield'});
    //     },

    //     unload: function() {
    //         // before a new route is run
    //     }
    // });
});


Template.feed.matches = function() {
    return Matches.find({}, {sort: {date: -1}});
};

Template.feed.events({
    'click input' : function() {
        // template data, if any, is available in 'this'
        if (typeof console !== 'undefined')
            console.log("You pressed the button");
    }
});


Template.feedMatch.calendar = function() {
    return moment.utc(this.date).local().calendar();
};

Template.feedMatch.iso_date = function() {
    return moment.utc(this.date).local().toISOString();
};

Template.feedMatch.winnerName = function() {
    var winner = Meteor.users.findOne(this.winner_id);
    return winner ? winner.username || winner.emails[0].address : 'someone';
};

Template.feedMatch.loserName = function() {
    var loser = Meteor.users.findOne(this.loser_id);
    return loser ? loser.username || loser.emails[0].address : 'someone';
};


var draftFromMatch = function(match) {
    var userWon = match.winner_id == Meteor.userId();
    var opponent = Meteor.users.findOne(userWon ? match.loser_id : match.winner_id);
    return {
        _id: match._id,
        creator: match.creator_id == Meteor.userId() ? Meteor.currentUser() : opponent,
        userScore: userWon ? match.winner_score : match.loser_score,
        opponent: opponent,
        opponentScore: userWon ? match.loser_score : match.winner_score,
        date: match.date
    };
};
var matchFromDraft = function(draft) {
    var userWon = parseInt(draft.userScore, 10) >= parseInt(draft.opponentScore, 10);
    return {
        _id: draft._id,
        creator_id: draft.creator && draft.creator._id,
        winner_id: userWon ? Meteor.userId() : draft.opponent._id,
        winner_score: userWon ? draft.userScore : draft.opponentScore,
        loser_id: userWon ? draft.opponent._id : Meteor.userId(),
        loser_score: userWon ? draft.opponentScore : draft.userScore,
        date: draft.date
    };
};
Template.newMatch.created = function() {
    if (this.data._id != Session.get('matchDraft')._id) {
        var draft = this.data._id ? draftFromMatch(Matches.findOne(this.data._id)) : {};
        Session.set('matchDraft', draft);
    }
};
Template.newMatch.events({
    'submit form': function (event, template) {
        Session.set('createMatchError', '');

        // var public = ! template.find(".private").checked;
        // var coords = Session.get("createCoords");

        var match = matchFromDraft(Session.get('matchDraft'));

        match.winner_score = parseInt(match.winner_score, 10);
        match.loser_score = parseInt(match.loser_score, 10);

        if (!isFinite(match.winner_score) || !isFinite(match.loser_score)) {
            Session.set('createMatchError', 'The match needs scores, or why bother?');
            return false;
        }


        // find the opponent
        // var opponentSearch = template.find('[name="opponent"]').value;
        // var opponentQueries = [
        //     {username: opponentSearch.toLowerCase()},
        //     {'emails.address': opponentSearch.toLowerCase()},
        //     {'profile.name': opponentSearch}
        // ];
        // var opponent = Meteor.users.findOne({$or: opponentQueries});

        if (!match.winner_id || !match.loser_id) {
            Session.set('createMatchError', 'Opponent not recognized.');
            return false;
        }

        if (match.winner_id == match.loser_id) {
            Session.set('createMatchError', 'You played against yourself, huh?');
            return false;
        }


        var id = createMatch(match);

        // Session.set("selected", id);
        // if (! public && Meteor.users.find().count() > 1) openInviteDialog();
        // Session.set("showCreateDialog", false);

        Session.set('matchDraft', {});

        Router.go('home');

        return false;
    },

    'focus [name="opponent"]': function(event, template) {
        Router.go('newMatchOpponent');
    },

    'keyup input[reactive], change input[reactive], paste input[reactive], input input[reactive], textInput input[reactive]': function(event, template) {
        // update matchDraft
        var $target = $(event.target);

        var draft = Session.get('matchDraft');
        draft[$target.attr('name')] = $target.val();
        Session.set('matchDraft', draft);

        return true;
    }

    // 'click .cancel': function() {
    //     Session.set("showCreateDialog", false);
    // }
});
Template.newMatch.opponentDisplayName = function() {
    var draft = Session.get('matchDraft');
    var opponent = draft.opponent || {};
    return opponent.username || '';
};
Template.newMatch.error = function() {
    return Session.get('createMatchError');
};
Template.newMatch.userScore = function() {
    var draft = Session.get('matchDraft');
    return draft.userScore;
};
Template.newMatch.opponentScore = function() {
    var draft = Session.get('matchDraft');
    return draft.opponentScore;
};



Template.selectUser.created = function() {
    this.data.session = new Session.constructor();
};
Template.selectUser.rendered = function() {
    this.find('input').focus();
};
Template.selectUser.preserve({
  'input[name]': function(node) { return node.name; }
});
Template.selectUser.matchingUsers = function() {
    var opponentSearch = this.session.get('entry') || '';
    if (!opponentSearch.length) return [];

    var opponentQueries = [
        {username: {$regex: opponentSearch, $options: 'i'}},
        {'emails.address': opponentSearch.toLowerCase()},
        {'profile.name': opponentSearch}
    ];
    return Meteor.users.find({$or: opponentQueries, _id: {$ne: Meteor.userId()}});
};
Template.selectUser.highlight = function(toHighlight, data) {
    var entry = data.session.get('entry');
    if (!entry || !entry.length) return toHighlight;

    var regex = new RegExp(entry, 'i');
    var match = regex.exec(toHighlight);
    if (!match || !match.length) return toHighlight;

    return new Handlebars.SafeString(toHighlight.substring(0, match.index) + '<mark>' + match[0] + '</mark>' + toHighlight.substring(match.index + match[0].length));
};

var updateUserSearchCache = function(template) {
    var entry = template.find('input').value;
    template.data.session.set('entry', entry);
};
Template.selectUser.events({
    'keyup input, change input, paste input, input input, textInput input': function(event, template) {
        updateUserSearchCache(template);
    },
    'click .js-select-user': function(event, template) {
        var $target = $(event.currentTarget);
        template.data.done(Meteor.users.findOne($target.data('id')));
    },
    'click .js-invite': function(event, template) {
        var entry = template.find('input').value;

        if (/.+@.+/.test(entry)) {
            alert('This isn\'t implemented yet. Email them yourself and tell them to sign up!');
        } else {
            alert('Enter an email above, then try again.');
            template.find('input').focus();
        }
    },
    'click .js-clear': function(event, template) {
        $(template.find('input')).val('');
        updateUserSearchCache(template);
    },
    'click .js-cancel': function(event, template) {
        template.data.fail();
    }
});



// Template.leaderboard.players = function() {
//     var selectedSort = Session.get('sort_by') || 'score';
//     var sortOption = SortOptions.findOne({name: selectedSort});
//     var query = {};
//     if (sortOption) {
//         return Players.find(query, {sort: sortOption.sort});
//     }
//     return Players.find(query);
// };

// Template.leaderboard.selected_name = function() {
//     var player = Players.findOne(Session.get("selected_player"));
//     return player && player.name;
// };

// Template.sorting.options = function() {
//     return SortOptions.find();
// };

// Template.sorting.active = function() {
//     var selectedSort = Session.get('sort_by') || 'score';
//     return selectedSort == this.name ? 'active' : '';
// };

// Template.player.selected = function() {
//     return Session.equals("selected_player", this._id) ? "selected" : '';
// };

// Template.leaderboard.events({
//     'click input.inc': function() {
//         Players.update(Session.get("selected_player"), {$inc: {score: 5}});
//     },
//     'click .js-sort-by': function(event) {
//         Session.set('sort_by', $(event.target).data('sort'));
//     }
// });

// Template.player.events({
//     'click': function() {
//         Session.set("selected_player", this._id);
//     }
// });
