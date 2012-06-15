var sys = require('util');
var pubsub = require('../lib/bubpubsub');

sys.puts("############## bubpubsub TESTs #########");

var myPubSub = new pubsub();

myPubSub.setDefaults({
	debugging: 1
});

function report(text) {
	sys.puts(text);
}

myPubSub.setDefaults({debugging:1});

var pubsubTests = {
	'[1] publish with Bubbles and Persistence': false,
	'[2] receive without bubbles': false,
	'[3] receive with bubbles': false,
	'[4] publish with Bubbles and NO Persistence': false,
	'[5] publish with NO Bubbles and Persistence': false,
	'[6] retrieve persistent publications': false,
	'[7] listing subscribers': false,	
}


function myLittleListener(data, currentBranch, publisher) { 
	sys.puts("---- [2] straight subscription");
	sys.puts('[2] subscribed without getBubbles to /politics/europe/germany and received publication on: '+data.originalTopic); 
	sys.puts('[2] caught this topic: '+currentBranch); 
	sys.puts('[2] publisher was: '+publisher); 
	pubsubTests['[2] receive without bubbles'] = true;
};


var myFirstSubscription = myPubSub.subscribe(
	'/politics/europe/germany',
	myLittleListener,  
	false, 
	'myLittleListener1'
);



var mySecondSubscription = myPubSub.subscribe(
	'/politics', 
	function(data, currentBranch, publisher) { 
		sys.puts("---- [3] bubbled subscription");
		sys.puts('[3] subscribed with getBubbles to /politics and received publication on: '+data.originalTopic); 
		sys.puts('[3] caught this topic: '+currentBranch); 
		sys.puts('[3] publisher was: '+publisher); 
		pubsubTests['[3] receive with bubbles'] = true;
	},  
	true, 
	'myLittleListener#2'
);



	
var pubTopic = '/politics/europe/germany';
var pubData = { content: "node module test #1" };
var pubId = 'myTestPublisher';
sys.puts("---- [1] published");
sys.puts('[1] on: '+pubTopic); 
sys.puts('[1] with content: '+pubData.content); 
sys.puts('[1] as publisher: '+pubId); 
sys.puts('[1] allowed bubbling'); 
sys.puts('[1] WITH persistence1'); 
myPubSub.publish(
	pubTopic, 
	pubData, 
	{ bubble:true, persist:true }, 
	pubId
);
pubsubTests['[1] publish with Bubbles and Persistence'] = true;



var pubTopic = '/politics/europe/germany/bavaria';
var pubData = { content: "node module test #4" };
var pubId = 'myTestPublisher4';
sys.puts("---- [4] published");
sys.puts('[4] on: '+pubTopic); 
sys.puts('[4] with content: '+pubData.content); 
sys.puts('[4] as publisher: '+pubId); 
sys.puts('[4] allowed bubbling'); 
sys.puts('[4] NO persistence'); 
myPubSub.publish(
	pubTopic, 
	pubData, 
	{ bubble:true,persist:false }, 
	pubId
);
pubsubTests['[4] publish with Bubbles and NO Persistence'] = true;



var pubTopic = '/politics/europe/germany/bavaria';
var pubData = { content: "node module test #5" };
var pubId = 'myTestPublisher5';
sys.puts("---- [5] published");
sys.puts('[5] on: '+pubTopic); 
sys.puts('[5] with content: '+pubData.content); 
sys.puts('[5] as publisher: '+pubId); 
sys.puts('[5] NO bubbling'); 
sys.puts('[5] WITH persistence'); 
myPubSub.publish(
	pubTopic, 
	pubData, 
	{ bubble:false,persist:true }, 
	pubId
);
pubsubTests['[5] publish with NO Bubbles and Persistence'] = true;



var allPersistentPublications = myPubSub.wasPublishedOnTopic('/politics/', true);
sys.puts("---- [6] allPersistentPublications");
sys.puts('[6] on: /politics'); 
for (var i in allPersistentPublications) {
	sys.puts('.................................................................');
	sys.puts('[6-'+i+'] caught this topic: '+allPersistentPublications[i].topic); 
	sys.puts('[6-'+i+'] as publisher: '+allPersistentPublications[i].publisher); 
	sys.puts('[6-'+i+'] bubbling: '+allPersistentPublications[i].settings.bubble); 
	sys.puts('[6-'+i+'] sent at: '+allPersistentPublications[i].timestamp); 
}
pubsubTests['[6] retrieve persistent publications'] = true;



sys.puts("---- [7] listing subscribers per topic");
for (var key in myPubSub.publicationChannels) {
	for (var receiver in myPubSub.publicationChannels[key]) {
		sys.puts('[7] '+key+' = '+myPubSub.publicationChannels[key][receiver].id);
	}
}
pubsubTests['[7] listing subscribers'] = true;



for (var name in pubsubTests) {
	var res = (pubsubTests[name]) ? "PASSED" : "failed";
	sys.puts('***** '+res+' ... PubSub test '+name);
}
