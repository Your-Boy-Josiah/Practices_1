const mongose = require('mongoose');

const productSchema = new mongose.Schema({
    name:{
        type: String,
        required: [true, 'Please add a name']
    },
    size:{
        type: String,
        required: [true, 'Please add a size'],
    },
    description:{
        type: String,
        required: [true, 'Please add a description']
    },
    price:{
        type: Number,
        required: [true, 'Please add a price']
    },
    quantity:{
        type: Number,
        required: [true, 'Please add a quantity']
    },

    

},{timestamps: true}  //Date of creation and update will be automatically added to the documentation.
);

//Create a model from Schema
const Product = mongose.model('Product', productSchema);
module.exports = Product;   //export the model to be used in other files

