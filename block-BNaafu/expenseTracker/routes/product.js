var express = require('express');
const Admin = require('../models/admin');
const User = require('../models/user');
const Category = require('../models/category');
var Auth = require(`../middleware/auth`)

const product = require('../models/product');
var router = express.Router();
const Product = require('../models/product');

/* GET -- Load Product Page */

router.get(`/add`, function(req, res, next){
    Category.find({}, (err, categories) => {
        if(err) next(Error)
        res.render(`productCreate`, {categories})
    })
})


/* POST - Product Added */

router.post(`/add`, function(req, res, next){
    Product.create(req.body, (err, product) => {
        if (err) next(err)
        Category.findOneAndUpdate({_id: product.category}, {$push: {products: product._id}} ,(err, category) => {
            req.flash(`success`, `Product Added Successfully`)
            res.redirect(`/product`)
        })

    })
  })


  /* GET - All Products */

router.get(`/`, function(req, res, next){
    Product.find({}, (err, products) => {
        if(err) next(err)
        Category.find({}, (err, categories) => {
            res.render(`productAll`, {products: products, message: req.flash("message"), categories: categories})
        })
    })
  })


    /* GET - SINGLE Products */

    router.get(`/:id`, function(req, res, next) {
        let id = req.params.id
        Product.findOne({_id: id}).populate("category").exec(
            (err, product) => {
                if(err) next(err);
                console.log(product, "Single Product Found")
                let message = req.flash(`message`)[0]
                res.render(`productSingle`, {product, message})
            })
        }) 

/* GET - LIKING A PRODUCT */

router.get(`/:id/like`, function(req, res, next) {
    let id = req.params.id
    Product.findOneAndUpdate({_id: id}, {$inc: {likes: 1}}, (err, product)=> {
    if(err) next(err)
    console.log(product, "Liked Product")
     res.redirect(`/product/${id}`)
    })
})

/* GET - Adding Product To Cart */

router.get(`/:id/cart`, function(req, res, next) {
    let id = req.params.id
    // var cart = req.session.cart || [];  
    let name = req.session.passport.user.name

    User.findOneAndUpdate({fname: name}, {$push: {cart: id}}, (err, user) => {
        if(err) next(err);
        console.log(user, "Cart added to User")
        req.flash("message", "Added to cart Successfully")
        res.redirect(`/product/${id}`)
    })
})

/* GET --  ADD NEW CATEGORY */

router.get(`/category/add`, function(req, res, next){
    res.render(`categoryAdd`)
})


/* POST --  ADD NEW CATEGORY */

router.post(`/category/add`, function(req, res, next){
    Category.create(req.body, (err, category) => {
        if(err) next(err);
        req.flash("message", "Category Created")
        res.redirect(`/product`)
    })
})


/* GET --  DELETE A PRODUCT */

router.get(`/:id/delete`, Auth.loggedInAdmin, function(req, res, next){
    let id = req.params.id
    Product.findOneAndDelete({_id: id}, (err, product) => {
        if(err) next(err);
        req.flash("message", "Product Deleted Successfully")
        res.redirect(`/product`)
    })
})


// FILTER CATEGORY

router.post(`/`,  function(req, res, next){
    Category.findOne({_id: req.body.category}).populate("products").exec((err, category) => {
        Category.find({}, (err, categories) => {
            if(err) next(err);
            console.log(category, "category")
            res.render(`productAll`, {products: category.products, categories: categories, message: `Category Selected: ${category.name}`})


        })
    })

})













module.exports = router;