var express = require('express');
const product = require('../models/product');
var router = express.Router();
const User = require('../models/user');
var Auth = require(`../middleware/auth`)
var passport = require(`passport`)
var nodemailer = require(`nodemailer`)
var bcrypt = require(`bcrypt`)
var Category = require(`../models/category`)
var Expense = require(`../models/expense`)
var Income = require(`../models/income`);
const { loggedInUser, assignSession } = require('../middleware/auth');
const expense = require('../models/expense');




/* GET users listing. */
router.get('/signup', function(req, res, next) {
  res.render(`userSignup`, {name: null});
});

router.get('/login', function(req, res, next) {
  res.render(`userLogin`, {name: null});
});


/* SUCCESS - OAUTH LOGIN */
router.get('/success', function(req, res, next) {
  res.render(`success`,{ title: 'Express' })
})

/* FAILURE - OAUTH LOGIN */
router.get('/failure', function(req, res, next) {
  res.render(`failure`, { title: 'Express' })
})



/* GET - LOADING DASHBOARD PAGE*/

router.get('/dashboard', loggedInUser, assignSession, function(req, res, next) {
  
  //handling req flash 
  if(req.session.flash == undefined){
     message = null
  } else if (Object.keys(req.session.flash).length !== 0){
    message = req.session.flash.message
  } else {
    message = null
  }
  req.session.flash = ""
  //sending expenses to chart!
  let data = []
  let totalExp = 0;
  let totalInc = 0
  var expenses1;
  let incomes1;
  let expCategory;
  let incCategory;
  let stringifiedData;
  let id = res.locals.id
  let name = res.locals.user.name


  Expense.find({user:id}).then((expense) => {
    expenses1 = expense
    console.log(expenses1, "expenses1")

    expenses1.forEach( function(expense){
      data.push({x: expense.name, value: expense.amount})
      totalExp += expense.amount
      
      
    })
    console.log(data, "data push")

  }).then((expenses) => {
    Income.find({user:id}).then((incomes) => {
      incomes1 = incomes
    }).then(() => {
      incomes1.forEach(function(income){
        totalInc += income.amount
      })
    })
      .then(() => {
        console.log("DATA fINAL", data)
        Category.find({}).exec((err, categories) => {
          expCategory =  categories.filter(category => category.categoryType === 'expense')
           incCategory =  categories.filter(category => category.categoryType === 'income')
          // console.log(expCategory, incCategory, "ALL VAR")
          stringifiedData = JSON.stringify(data)    
          res.render(`userDashboard`, {name: name, message: message, expCategories: expCategory, expenses: expenses1,  incCategories: incCategory, incomes: incomes1, data: stringifiedData, totalExp: totalExp, totalInc: totalInc})
        })
      })  
      })

    })
    








/* POST - USER SIGNUP */

//GENERATING RANDSTR for VERIFICATION
var randStr = function(){
  const len = 8;
  let randStr = "";
  for(let i = 0; i<len; i++){
      const ch = Math.floor((Math.random() * 10)+ 1)
      randStr += ch
  }
  return randStr;
}

//CREATING A FUNCTION TO SEND EMAIL FOR VERIFICATION

var sendEmail = (email, uniqueStr) => {
  var Transport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "jopoepl@gmail.com",
      pass: "airqbpptmztuwgeg"
    }
  })
  var mailOptions;
  let sender = "Expense Tracker";
  mailOptions = {
    from: sender,
    to: email,
    subject: "Email Confirmation",
    html: `Click on this <a href=http://localhost:3000/verify/${uniqueStr}>link here</a> to verify your email. Cheers!`
  };

  Transport.sendMail(mailOptions, function(err, response) {
    if(err) {
      console.log(err)
    } else {
      console.log("EMAIL SENT TO USER")
    }
  })

}

//CREATING NEW USER WITH EMAIL VERIFICATION SENT!

router.post(`/signup`, function(req, res, next){
  let email = req.body.email
  let uniqueStr = randStr();
  req.body.uniqueStr = uniqueStr
  User.create(req.body, (err, user) => {
      if (err) next(err)
      sendEmail(email, uniqueStr)
      req.flash(`success`, `Signup Successful`)
      res.redirect(`/users/login`)
  })
})




/* POST - Handle LOGIN FOR USER. */
router.post(`/login`, function(req, res, next) {
  var {email, password} = req.body;
  if (!email || !password) {
   req.flash("message", "Email or Password cannot be empty")
    return res.redirect(`/users/login`)
  }
  User.findOne({email: email}, (err, user) => {
      if(err) return next(err) //no user
      if(!user){
        req.flash("message", "User not found")
        return res.redirect(`/users/login`)
      }
  user.verifyPassword(password, (err, result) => {
          if(!result) {
            if(err) next(err);
            req.flash("message", "Incorrect password")
            return res.redirect(`/users/login`)
          }
          if(err) next(err);
      req.session.userid = user._id
      req.session.name = user.fname
      req.session.type = "user";
      let username = user.fname
      User.findOne({email: email},(err, user)=> {
          res.redirect(`/users/onboarding`)
        })
     })
  })
})

/* GET -- LOADING PASSWORD RESET PAGE */
router.get(`/password/reset`, (req,res, next)=> {
  let name = req.session.name
  res.render(`userPassReset`, {name: name})
})


/* POSTING -- RESETING PASSWORD */


router.post(`/password/reset`, (req,res, next)=> {
  let id = req.session.userid
  let oldpassword = req.body.oldpassword
  User.findOne({_id: id}).exec((err, user) => {
    if(err) next(err)
    user.verifyPassword(oldpassword, async function(err, result) {
      let response = await result
      if(response){
      let hash = await bcrypt.hash(req.body.password, 10)  
      User.findOneAndUpdate({_id: id}, {password: hash}, (err, user) => {
          if(err) next(err);
          return res.redirect(`/users/logout`)
        })
      } else {
        res.json(`incorrect old password`)
      }
  })
  })

})

/* GET -- GETTING USERS ONBOARD */

router.get(`/onboarding`, loggedInUser, (req, res, next) => {
  if(req.session.name !== undefined ){
    var name = req.session.name
  } else {
    var name = req.session.passport.user.name
  }
  
  res.render(`userOnboarding`, {name: name} )
})

/* GET -- ADDING INCOME */

router.get(`/income/add`, (req, res, next) => {
  let name = req.session.name
  Category.find({categoryType: "income"}, (err, categories) =>{ 
    if(err) next(err);
    res.render(`addIncome`, {categories: categories || null, name: name})
  })
  
})


/* POST -- ADDING INCOME */
router.post(`/income/add`, (req, res, next) => {
  let id = req.session.userid
  req.body.user = id
  Income.create(req.body, async (err, income) => {
    let incomeId = income._id
    if(err) next(err)
    await User.findOneAndUpdate({_id: id}, {$push: {income: incomeId}}, (err, user)=> {
      if(err) next(err);
      req.flash("message", "Income Added Successfully")
      res.redirect(`/users/onboarding`)
    } )
  })
})

/* GET -- ADDING EXPENSE */

router.get(`/expense/add`, (req, res, next) => {
  let name = req.session.name
  Category.find({categoryType: "expense"}, (err, categories) =>{ 
    if(err) next(err);
    res.render(`addExpense`, {categories: categories || null, name: name})
  })
})

/* POST -- ADDING EXPENSE */
router.post(`/expense/add`, (req, res, next) => {
  let id = 
  req.session.user === undefined ? req.session.passport.user.id : req.session.user.id;
  req.body.user = id
  Expense.create(req.body, (err, expense) => {
    let expenseId = expense._id
    if(err) next(err)
     User.findOneAndUpdate({_id: id}, {$push: {expense: expenseId}}, (err, user)=> {
      if(err) next(err);
      req.session.flash = ""
      req.flash("message", "Expense Added Successfully")
      res.redirect(`/users/onboarding`)
    } )
  })
})


/* GET -- ADDING Category */

router.get(`/category/add`, (req, res, next) => {
  let name = req.session.name
  res.render(`categoryAdd`, {name})
})



/* POST -- ADDING Category */

router.post(`/category/add`, (req, res, next) => {
  Category.create(req.body, (err, category) => {
    if(err) next(err)
    return res.redirect(`/users/onboarding`)
  })
})






/* GET -- Loading CART CONTENTS */

// router.get(`/cart`, (req, res, next) => {
//   let name = req.session.passport.user.name
//   User.findOne({fname: name}).populate("cart").exec((err, user)=> {
//     console.log("CARt CONTENT", user.cart)
//     let products = user.cart
//     res.render(`cart`, {products})
//   })
// })

// router.get(`/cart/clear`, (req, res, next) => {
//   let name = req.session.passport.user.name
//   User.findOneAndUpdate({fname: name}, {cart: []}, (err, user) => {
//     res.redirect(`/users/dashboard`)
//   })
// })

// /* GET -- Loading ALL USERS */
// router.get(`/all`, Auth.loggedInAdmin,  (req, res, next) => {
//   User.find({}, "fname lname email blocked", (err, users) => {
//     if(err) next(err);
//     res.render(`usersAll`, {users: users, message: req.flash(`error`) })
//   })
// })


// /* GET -- BLOCLING A USER */
// router.get(`/:id/block`, (req,res,next) => {
//   let id = req.params.id
//     User.findOneAndUpdate({_id: id}, {blocked: true}, (err, updatedUser) => {
//       if(err) next(err);
//       res.redirect(`/users/all`)
//   })
// })


// Expense.find({user:userid}).exec( async (err, expenses) => {
//     if(err) next(err);
//     expenses.forEach(await function(expense){
//       data.push({x: expense.name, value: expense.amount})
//       totalExp += expense.amount
//     })
//     await Income.find({user:userid}).exec( (err, incomes) => {
//       if(err) next(err);
//       incomes.forEach(function(income){
//         totalInc += income.amount
//         Category.find({}).exec((err, categories) => {
//           if(err) next(err)
//           let expCategory = categories.filter(category => category.categoryType === 'expense')
//           let incCategory = categories.filter(category => category.categoryType === 'income')

//           res.render(`userDashboard`, {name: name, message: message, expCategories: expCategory,expenses: expenses,  incCategories: incCategory,incomes: incomes, data: JSON.stringify(data), totalExp: `${totalExp}`,totalInc: `${totalInc}`})
    
//       })
//       })
//     })

//   })

/* GET -- UNBLOCLING A USER */
router.get(`/:id/unblock`, (req,res,next) => {
  let id = req.params.id
    User.findOneAndUpdate({_id: id}, {blocked: false}, (err, updatedUser) => {
      if(err) next(err);
      res.redirect(`/users/all`)
  })
})




/* HANDLING FILTERS - DASHBOARD*/
router.get(`/dashboard/filter`,assignSession, function(req, res, next){
  let data = []
  let totalExp = 0;
  let totalInc = 0
  var expenses1;
  let incomes1;
  let expCategory;
  let incCategory;
  let stringifiedData;
  let id = res.locals.id
  let name = res.locals.user
  let incSource = req.query.incSource || /.*/g
  console.log(incSource, "incSource")
  // let id = 
  // req.session.user === undefined ? req.session.passport.user.id : req.session.user.id
  // let name = req.locals.user
  let dateFrom =  new Date(req.query.dateFrom).toJSON()
  // req.query.dateFrom ? new Date(req.query.dateFrom) : new Date("2022-01-01") ;
  let dateTo = new Date(req.query.dateTo).toJSON()
  // req.query.dateTo ? new Date(req.query.dateTo) : new Date();
  console.log(req.query, "id")

  User.findOne({_id: id}).populate({
    "path": "expense",
    "match": {category: req.query.expSource, date: {$gt: dateFrom, $lt: dateTo}}
  }).populate({
    "path": "income",
    "match": {category: incSource, date: {$gt: dateFrom, $lte: dateTo}},
  }).exec((err, user) => {
    console.log(user, "filtered exp", "filtered inc")

    Category.find({}).then( async (categories) => {
      expCategory =  categories.filter(category => category.categoryType === 'expense')
      incCategory =  categories.filter(category => category.categoryType === 'income')
      incomes1 = user.income
      await incomes1.forEach(function(income){
        totalInc += income.amount
      })
      expenses1 = user.expense
      expenses1.forEach( function(expense){
        data.push({x: expense.name, value: expense.amount})
        totalExp += expense.amount
      })
     stringifiedData = JSON.stringify(data)  
     console.log(stringifiedData, "STR DATA")
      res.render(`userDashboard`, {name: name, message: `DATE RANGE: ${dateFrom} to ${dateTo}`, expCategories: expCategory, expenses: expenses1,  incCategories: incCategory, incomes: incomes1, data: stringifiedData, totalExp: totalExp, totalInc: totalInc})


    })

  })
})




// router.get(`/dashboard/filter`, function(req, res, next){
//   let query = req.query
//   let id;
//   console.log(query, "QUERY")
//   try{
//     passport = req.session.passport.user.id
//   } catch {
//     passport = undefined
//   }
//   if(passport !== undefined) {
//     id = passport
//   } else {
//     id = req.session.userid
//   }

//   var name;
//   var message;
//   var userid = req.session.userid

//   if(req.session.passport) {
//      name = req.session.passport.user.name
//   } else {
//      name = req.session.name
//   }
//   //handling req flash 
//   if(req.session.flash == undefined){
//      message = null
//   } else if (Object.keys(req.session.flash).length !== 0){
//     message = req.session.flash.message
//   } else {
//     message = null
//   }
  
//   // let id = 
//   // typeof(req.session.user.id) == undefined ? req.session.passport.user.id : req.session.user.id;


//   let incSource = req.query.incSource;
//   let expSource = req.query.expSource
//   let fromDate = req.query.dateFrom
//   let toDate = req.query.dateTo
//   let categoryType = req.query.categoryType
//   User.findOne({_id: id}).populate(`income`).populate(`expense`).exec((err, user) => {
//     console.log(user, "populated user")
//     //handling no income selected === ALL Income
//     if(incSource === ""){
//       var incomeFiltered =  user.income
//     } else {
//       var incomeFiltered =  user.income.filter(income => income.category === incSource)
//     }
//    var expFiltered; 
//   // =  user.expense.filter(expense => expense.category === expSource)
//    //populating data with filtered values
//    let data = [];
//    let totalExp =0;
//    let totalInc = 0;

//     Expense.find({$match: {user: id, date: {$gte: fromDate}, date: {$lt: toDate}}})
//     .exec((err, (expenses) => {
//       expFiltered = expenses
//       console.log(expFiltered, "expFiltered")
//       expFiltered.forEach(expense => {
//         totalExp += expense.amount
//         data.push({x: expense.name, value: expense.amount})
//        })
//        incomeFiltered.forEach(income => {
//         totalInc += income.amount
//        })
//              Category.find({}).exec((err, categories) => {
//             if(err) next(err)
//             let expCategory = categories.filter(category => category.categoryType === 'expense')
//             let incCategory = categories.filter(category => category.categoryType === 'income')
    
//             res.render(`userDashboard`, {name: name, message: message, expCategories: expCategory,  incCategories: incCategory, data: JSON.stringify(data), totalExp: `${totalExp}`,totalInc: `${totalInc}`})
//             })
//       console.log(expFiltered, "inside exp find")
//     })
//     )

   
//   })


// })






/* GET -- LOGGING OUT USER */

router.get(`/logout`, (req, res, next) => {
  req.session.destroy();
   res.redirect(`/users/login`)
})


module.exports = router;
