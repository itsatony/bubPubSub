var bub = require("../lib/bubpubsub");
var should = require('should');

describe('BubPubSub', function() {
	var myBubPubSub = null;
	var bubSubId = "bubpubsubId";
	/**
	 *Stuff before running tests
	 */
	beforeEach(function(done) {

		/**
		 *Test bubPubSub constructor
		 */
		myBubPubSub = new bub(bubSubId);
		// myBubPubSub.defaults.debugging = 1;
		should.exist(myBubPubSub);

		done();
	});

	it("should check the default constructor attributes", function(done) {
		// console.log(myBubPubSub);
		myBubPubSub.VERSION.should.equal('0.8.7');
		myBubPubSub.id.should.equal(bubSubId);

		myBubPubSub.defaults.bubble.should.be.a("boolean");
		myBubPubSub.defaults.persist.should.be.a("boolean");
		myBubPubSub.defaults.getBubbles.should.be.a("boolean");
		myBubPubSub.defaults.getPersists.should.be.a("boolean");
		myBubPubSub.defaults.chain.should.be.a("boolean");

		/**
		 * checks if scope: Circular -> id = same id like before.
		 */
		myBubPubSub.defaults.scope.id.should.equal(bubSubId);

		myBubPubSub.defaults.debugging.should.be.a("number");
		myBubPubSub.defaults.forceUniqueSubscriber.should.be.a("boolean");
		myBubPubSub.defaults.skipOverFailedSubscribers.should.be.a("boolean");
		myBubPubSub.defaults.chainDelay.should.be.a("number");
		myBubPubSub.defaults.throwErrors.should.be.a("boolean");
		myBubPubSub.defaults.catchSubscriberErrors.should.be.a("boolean");

		/**
		 * checks if the array is empty
		 */
		myBubPubSub.errors.should.have.length(0);
		myBubPubSub.publicationChannels.should.be.a('object');
		myBubPubSub.publicationLog.should.have.length(0);
		myBubPubSub.publicationAnnouncements.should.have.length(0);

		done();
	});

	it("should check the subscriber first time", function(done) {
		var path = '/politics/europe';
		var subscriberName = 'myLittleListener';
		var mySubscription = myBubPubSub.subscribe(path, function(currentBranch, publisher, reply) {
			// console.log(data.originalTopic);			reply('this is a stupid example');
		}, {
			getBubbles : true,
			getPersists : false
		}, subscriberName);

		should.exist(myBubPubSub.publicationChannels[mySubscription.topic][subscriberName]);		myBubPubSub.publicationChannels[mySubscription.topic][mySubscription.id].getBubbles.should.equal(true);
		myBubPubSub.publicationChannels[mySubscription.topic][mySubscription.id].getPersists.should.equal(false);
		myBubPubSub.publicationChannels[mySubscription.topic][mySubscription.id].autoUnsubscribe.should.equal(false);
		myBubPubSub.publicationChannels[mySubscription.topic][mySubscription.id].id.should.equal(mySubscription.id);
		myBubPubSub.publicationChannels[mySubscription.topic][mySubscription.id].fired.should.equal(0);		done();
	});

	it("should check publish methode", function(done) {
		var regexForId = /pub_*/;

		var path = '/politics/europe';
		var content = 'this is wonderfool';
		var publisherName = 'myTestPublisher';
		var myPublisher = myBubPubSub.publish(path, {
			content : content,
		}, {
			bubble : true,
			persist : true
		}, publisherName);

		should.exist(myBubPubSub);
		myPublisher.topic.should.equal(myBubPubSub.__stripSlashes(path));
		myPublisher.data.content.should.equal(content);
		/**
		 * TODO sollte nur beim ersten mal Funktioniere...
		 * myPublisher.data.originalTopic.should.equal(path); path ist die falsche
		 * Übergabe
		 */
		myPublisher.data.originalTopic.should.equal(myBubPubSub.__stripSlashes(path));
		(regexForId.test(myPublisher.data.uniquePublicationId)).should.equal(true);
		myPublisher.settings.bubble.should.be.a('boolean');
		myPublisher.settings.persist.should.be.a('boolean');
		myPublisher.publisher.should.equal(publisherName);
		// console.log(myPublisher);		done();
	});

	it("should check setDefaults method", function(done) {
		var defaults = {
			scope : this,
			persist : true,
			bubble : true,
			forceUniqueSubscriber : true,
			debugging : 1
		};

		var newDefaults = myBubPubSub.setDefaults(defaults);

		defaults.scope.should.be.equal(newDefaults.scope);
		defaults.persist.should.be.equal(newDefaults.persist);
		defaults.bubble.should.be.equal(newDefaults.bubble);		defaults.forceUniqueSubscriber.should.be.equal(newDefaults.forceUniqueSubscriber);		defaults.debugging.should.be.equal(newDefaults.debugging);		done();
	});

	it("should check __stripSlashes method", function(done) {
		var s = "/test/test/";
		var newS = myBubPubSub.__stripSlashes(s);
		// console.log(s + " - " + newS);
		newS.should.be.equal("test/test");
		done();
	});

/**
 *failed in publish() on line 274
 *
 */
	it("should check converse method", function(done) {
		var path = '/politics/europe';
    var content = 'this is wonderfool';
    var publisherName = 'myTestPublisher';
    var myPublisher = myBubPubSub.publish(path, {
      content : content,
    }, {
      bubble : true,
      persist : true
    }, publisherName);

// console.log(publication);
		var path = '/politics/europe';
		var subscriberName = 'myLittleListener';
		var mySubscription = myBubPubSub.subscribe("/reply" + path, function(currentBranch, publisher, reply) {
			// console.log(data.originalTopic);
			reply('this is a stupid example');
		}, {
			getBubbles : true,
			getPersists : true
		}, subscriberName);

		var conversation = myBubPubSub.converse(myPublisher, mySubscription);
		
		conversation.state.should.be.equal('published');
		conversation.subscription.topic.should.be.equal('reply'+path);
		conversation.publication.topic.should.be.equal(myBubPubSub.__stripSlashes(path));

		done();
	});

}); 