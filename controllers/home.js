/**
 * GET /
 * Home page.
 */

exports.index = function(req, res) {
  console.log("Index called");
  res.render('home', {
    title: 'Mnemonik'
  });
};
