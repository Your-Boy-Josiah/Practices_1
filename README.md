## My First Commit
This is a Practices of My Backend Class from TS Academy This is my first commit and i have noticed i made some errors in my push like One my node module was push also my .env file I will delete them on a later date bit for now it all pkay

## My Second Commit 
I created the User routes and Controller and I had issues push to my github so it looks like I did to Second commit. Guess it would not be so easy i have to fail to grow 

## Added a README.md in this commit
through a commit that was fun to learn to do because i did not know what a README.md is but i realise it whatever i want it to be and a story of my codes journey 

'I used AI today to write the below but i guess after today i wouldn't use it any more it requires a lot of supervision and people act like it doesn't that is werid'  

### I Expanded more On the User.js and Product.js Models in this commit
I went back and rewrote both the `User` model and the `Product` model to be more complete and production-ready. Before, they were bare minimum. Now they are structured to actually support a real inventory management system for a store or supermarket — with proper fields, types, defaults, and validation in place.

### I  ReBuilt the Product_Controller.js in this commit
This was one of the biggest steps so far. I wrote the full `Product_Controller.js` which handles five core operations:

- **CreateProduct** — Validates required fields, checks for duplicate barcodes and SKUs, sanitises and casts all input types, then saves the product to the database.
- **GetProducts** — Returns a paginated list of all active products with support for search (by name, barcode, or SKU), category filtering, and a low-stock filter that compares quantity against each product's reorder level.
- **GetProductByBarcode** — A fast single-product lookup by barcode, designed for POS scanner use at a till point.
- **UpdateProduct** — Validates the MongoDB ObjectId before hitting the database, normalises SKU and barcode fields, and returns the updated document.
- **DeleteProduct** — A soft delete that sets `isActive: false` instead of removing the record, so historical data like past sales is never lost.

I also made sure all numeric fields use `=== undefined` checks rather than simple falsy checks, so that a value of `0` is never incorrectly rejected as missing.

### ReBuilt the Product Routes in this commit

I wrote `Product_Routes.js` to wire up all the controller functions to their correct HTTP endpoints. The route file is clean and structured — public routes like `GetProducts` and `GetProductByBarcode` are open, while `CreateProduct`, `UpdateProduct`, and `DeleteProduct` are protected behind `verifyToken` and `requireAdmin` middleware so only authenticated admins can modify inventory.

One important detail I learned: the `/barcode/:barcode` route **must be declared before** the `/:id` route, otherwise Express would incorrectly treat the word `barcode` as a dynamic ID parameter and route requests to the wrong handler.

## New Commit: Doing another ReBuild of all my files and add Auth & Custom Features
Today, I fully Rewired my the backend architecture. I loved the idea of creating custom features and aliases, like doing `const PM = require('mongoose')` and `const TFA = require('bcrypt')` just to personalize the code and make it my own. 
Other things I did in this commit:
- Added a `pre('save')` hook to `User.js` to hash passwords automatically so the controller stays clean.
- Fixed the Mongoose virtuals in `Product.js` by adding `toJSON: { virtuals: true }` so the frontend can actually see the math.
- Rewrote the User Controller to generate JWT tokens and properly handle MongoDB duplicate key errors (11000).
- Created `Middleware` to act as a bouncer for protected routes, but just a folder for now
- Built a clean `Database_Config.js` and wired everything together in my main `app.js` file.

## 🚀 Progress & Milestones

- [x] Initialised Git repository and configured VS Code with Git Bash
- [x] Configured `.gitignore` to exclude `node_modules`, `.env`, and other sensitive files
- [x] Built and connected MongoDB with Mongoose
- [x] Expanded User Model with full fields for authentication and role management
- [x] Expanded Product Model with full fields for inventory tracking (barcode, SKU, cost, reorder level, expiry, etc.)
- [x] Built User Controller with registration and login logic
- [x] Built Product Controller with Create, Read, Update, and Soft Delete
- [x] Built Product Routes with public and admin-protected endpoints
- [x] Added pagination, search, category filter, and low-stock filter to GetProducts
- [x] Added ObjectId validation and duplicate key (11000) error handling
- [ ] Update User Routes to match the current User Controller
- [ ] Add authentication token refresh logic
- [ ] Connect frontend or POS interface to the API

## 🏗️ Project Structure

├── Controllers/
│   ├── User_Controller.js        # Handles user registration and login
│   └── Product_Controller.js     # Handles all product CRUD operations
│
├── Models/
│   ├── User.js                   # User schema (auth, roles)
│   └── Products.js               # Product schema (inventory fields)
│
├── Routes/
│   ├── User_Routes.js            # User-facing endpoints
│   └── Product_Routes.js         # Product endpoints (public + admin-protected)
│
├── middleware/
│   └── authMiddleware.js         # verifyToken and requireAdmin middleware (I Do not have a middleware yet do that later)
│
├── .gitignore
├── .env                          # Environment variables (never committed)
└── server.js                     # Entry point — Express app setup


---

## 🛠️ API Endpoints

### Products — `/api/products` For Postman 

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/products` | Public | Get all active products (pagination + search + filters) |
| GET | `/api/products/barcode/:barcode` | Public | Look up a product by barcode (POS scanner) |
| POST | `/api/products` | Admin only | Create a new product |
| PUT | `/api/products/:id` | Admin only | Update an existing product |
| DELETE | `/api/products/:id` | Admin only | Soft delete (deactivate) a product |

**Available query params for GET `/api/products`:**
?page=1          → Page number (default: 1)
?limit=20        → Results per page (default: 20, max: 100)
?search=milk     → Search by name, barcode, or SKU
?category=dairy  → Filter by category
?lowStock=true   → Return only products at or below their reorder level


### Users — `/Users` For Postman

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/Users/CreateUser` | Public | Register a new user |
| POST | `/Users/LoginUser` | Public | Login and receive a JWT wristband |

## 🛠️ Key Commands & Workflow Reference

### Managing Files
```bash
# Create files
touch README.md .gitignore

# Check current directory
pwd

### Git Workflow
```bash
# Stage and commit changes
git add .
git commit -m "your message here"
git push origin main

# Check what has changed before staging
git status
git diff

### Running the Server
```bash
# Install dependencies
npm install

# Start the development server
npm run dev

## 📌 Notes to Self

- Always check `.gitignore` before the first push — `node_modules` and `.env` should never be committed.
- The `/barcode/:barcode` route must always be declared before `/:id` in any Express router.
- Use `=== undefined` not `!value` when validating numeric fields — zero is a valid quantity.
- Soft deletes (`isActive: false`) are safer than hard deletes for inventory systems — past sales records depend on the product data still being there.
- You can create custom features/aliases like `const PM = require('mongoose')` to personalize the code.
- Never put password hashing in the controller if you use a `pre('save')` hook in the model (avoids the double-hash bug).
- Mongoose hides virtual fields by default. Always add `toJSON: { virtuals: true }` to the schema to see them in API responses.
- Using `.lean()` in queries strips away Mongoose virtuals, so remove it if you need calculations to show up.
- Login routes should always be `POST`, never `PUT`.
- If the database fails to connect in the config, use `process.exit(1)` to kill the ser