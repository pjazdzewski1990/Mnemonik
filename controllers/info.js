var Info = require('../models/Info');

exports.demo = function(req, res) {
	Info.find({}, null, { limit: 10 }, function (err, docs) {
		if(err) console.log("Err: " + err);
    
		res.render('info/demo', {
    	title: 'Mnemonik - demo test',
			infos: docs
  	});
	});
};

exports.result = function(req, res) {
  res.render('info/result', {
  	title: 'Mnemonik - demo test',
    score: req.params.score*100
  });
};

exports.timeline = function(req, res) {
	Info.find({}, function (err, docs) {
		if(err) console.log("Err: " + err);
    
    var grouped = [];
    docs.map( function (a) { 
      if(a.chapter in grouped){
        console.log("Push" + a.chapter);
        grouped[a.chapter].push(a);
      }else{
        console.log("New " + a.chapter);
        grouped[a.chapter] = [a];
      } 
    });
    console.log("grouped " + grouped);
    
		res.render('info/timeline', {
    	title: 'Mnemonik - timeline',
			chapter0: grouped["CHAPTER 1 – THE START OF  CIVILIZATION"],
      chapter1: grouped["CHAPTER 2 – ANCIENT GREEK"],
      chapter2: grouped["CHAPTER 3 – ROMAN EMPIRE"]
  	});
	});
};

exports.learn = function(req, res) {
  if(!req.session.visited){
    req.session.visited = [];
  }
  req.session.visited.push(req.params.id);
  
	Info.findOne({_id: req.params.id, bought: true}, function (err, doc) {
		if(err) console.log("Err: " + err);
		
		console.log("Display " + req.params.id + " " + doc);
		res.render('info/date', {
    	title: 'Mnemonik - date',
			info: doc
  	});
	});
};

exports.update = function(req, res) {
	Info.findOne({_id: req.query.id}, function (err, doc) {
		if(err) console.log("Err: " + err);
		
		console.log("Update " + req.query.id + " " + doc);
		console.log("To " + req.query.text);
    
    doc.mnemoniks[0].link = req.query.text;
    doc.save(function (err, product, numberAffected) {
      if (err) console.log("Error while update " + err);
    });
	}); 
};

exports.ignore = function(req, res) {
	Info.findOne({_id: req.params.id}, function (err, doc) {
		if(err) console.log("Err: " + err);
		
		console.log("Ignore " + req.params.id + " " + doc);
    
    doc.ignored = true;
    doc.save(function (err, product, numberAffected) {
      if (err) console.log("Error while update " + err);
    });
	}); 
};

exports.next = function(req, res) {
  if(!req.session.visited){
    req.session.visited = [];
  }
  req.session.visited.push(req.params.id);
  
	Info.find({bought: true, ignored: false}, function (err, docs) {
		if(err) console.log("Err: " + err);
    
    var found;
    for(var i=0; i<docs.length; i++){
      if(docs[i]._id == req.params.id){
        found = docs[i + 1];
      }
    }
    
    if(!found){
      found = docs[0];
    }

		res.render('info/date', {
    	title: 'Mnemonik - date',
			info: found
  	});
	});
};

exports.test = function(req, res) {
  console.log("exports.test = " + req.session.visited);
	Info.find({_id: {$in: req.session.visited}}, null, { limit: 10 }, function (err, docs) {
		if(err) console.log("Err: " + err);
    console.log("docs = " + docs);
    
    req.session.visited = [];
    
		res.render('info/demo', {
    	title: 'Mnemonik - test',
			infos: docs
  	});
	});
};

exports.mnemo = function(req, res) {
  res.render('info/mnemo', {
  	title: 'Mnemonik'
  });
};
