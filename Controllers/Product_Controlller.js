const Product = require('../Models/Products');

//Create a New Product first method
// const createProduct = async (req, res) => {
//     try {
//         const product = new Product(req.body);
//         await product.save();
//         res.status(201).json(product);
//     } catch (error) {
//         res.status(400).json({message: error.message});
//     }
// };

// module.exports = ( createProduct );

//Create a New Product Second Method Note: the better one is THIS 

exports.CreateProduct = async (req, res) => {
    try {
         //check if all required fields are provided
        if (!req.body.name || !req.body.size || !req.body.description || !req.body.price || !req.body.quantity) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const { name, size, descripiom, price, quantity } = req.body;

        const Product = new Product({ 

            name,
            size,
            description,
            price,
            quantity 

        });

        await Product.save();
        res.status(201).json({ message: 'Product created sucessfully' });  
    } catch (errpr) {
        res.status(500).json({ message: "Error creating 'PRODUCT' ", error: error.message });
    } 

};

// Update a Product
exports.UpdateProduct= async (req, res) => {
    try { 
        const { id } = req.params;
        const { name, size, descripiom, price, quantity } = req.body;

        const product = await Product.findByIdAndUpdate(id, { 

            name,
            size,
            description,
            price,
            quantity 

        }, { new: true });
        if (!product) {
            return res.status(404).json({message: 'product not found'})
        }
        res.status (200).json({message: 'Product updated successfully' , product});
    } 
    catch (error) {
        res.status(500).json({message: 'Error updationg product' , errror: error.message });
    }
   
};

