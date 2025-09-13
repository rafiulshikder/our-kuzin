# Our Kuzin - Food Delivery Application

## Features

### User Site Features
- **Authentication**: User registration and login system
- **Home Page**: 
  - Image slider with auto-rotation
  - Trending products section
  - New arrivals section
  - Deal of the day section
  - Search functionality
- **Product Management**:
  - Product browsing with images, titles, and prices
  - Product detail pages with quantity selection
  - Add to cart functionality
  - Wishlist management
- **Shopping Cart**: 
  - Add/remove items
  - Quantity management
  - Total calculation
- **Order Management**:
  - Complete order form with delivery details
  - Payment options (UPI and Cash on Delivery)
  - Order confirmation system
- **User Profile**:
  - Order history
  - Saved addresses
  - Account management
- **Search**: Product search by name and category
- **Mobile Responsive**: Optimized for all device sizes

### Admin Panel Features
- **Admin Authentication**: Secure admin login system
- **Dashboard**: 
  - Statistics overview (products, orders, users, revenue)
  - Recent orders display
- **Product Management**:
  - Add new products with multiple images
  - Edit existing products
  - Delete products
  - Category management
  - Set trending, new arrival, and deal of the day flags
- **Slider Management**:
  - Upload slider images
  - Delete slider images
- **Order Management**:
  - View all orders
  - Update order status (Pending, Confirmed, Processing, Shipped, Delivered, Cancelled)
  - Filter orders by status
- **User Management**:
  - View all registered users
  - User details and registration dates
  - Search users

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase Realtime Database
- **Authentication**: Firebase Authentication
- **File Storage**: Firebase Storage
- **UI Framework**: Custom CSS with responsive design
- **Icons**: Font Awesome 6.0

## Setup Instructions

### 1. Prerequisites
- A modern web browser
- Firebase project with Realtime Database and Storage enabled
- Firebase Authentication enabled

### 2. Firebase Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing one

2. **Enable Services**:
   - **Authentication**: Enable Email/Password authentication
   - **Realtime Database**: Create database in test mode
   - **Storage**: Enable storage for file uploads

3. **Database Rules**:
   Set up the following database structure:
   ```
   /users - User profiles
   /products - Product catalog
   /orders - Order management
   /slider - Slider images
   /admins - Admin users
   ```

4. **Storage Rules**:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

### 3. Admin Setup

1. **Admin Login Credentials**:
   - **User ID**: ``
   - **Password**: ``

2. **Admin Access**:
   - Open `admin.html` in a web browser
   - Use the above credentials to login
   - The system will automatically create the admin account if it doesn't exist

### 4. Running the Application

1. **User Site**:
   - Open `index.html` in a web browser
   - Or serve using a local server:
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js
     npx serve .
     ```

2. **Admin Panel**:
   - Open `admin.html` in a web browser
   - Login with admin credentials

## File Structure

```
curio-market/
├── index.html          # User site main page
├── admin.html          # Admin panel main page
├── styles.css          # User site styles
├── admin-styles.css    # Admin panel styles
├── app.js             # User site JavaScript
├── admin.js           # Admin panel JavaScript
└── README.md          # Project documentation
```

## Database Schema

### Users
```javascript
{
  "users": {
    "userId": {
      "name": "User Name",
      "email": "user@example.com",
      "createdAt": 1234567890
    }
  }
}
```

### Products
```javascript
{
  "products": {
    "productId": {
      "title": "Product Name",
      "price": 999,
      "category": "Electronics",
      "description": "Product description",
      "images": ["url1", "url2"],
      "priceOff": 10,
      "trending": true,
      "newArrival": false,
      "dealOfDay": false,
      "createdAt": 1234567890
    }
  }
}
```

### Orders
```javascript
{
  "orders": {
    "orderId": {
      "userId": "user123",
      "products": [
        {
          "id": "product123",
          "title": "Product Name",
          "price": 999,
          "quantity": 2
        }
      ],
      "total": 1998,
      "deliveryDetails": {
        "fullName": "John Doe",
        "phoneNumber": "1234567890",
        "pincode": "123456",
        "state": "State",
        "city": "City",
        "houseNo": "123",
        "roadName": "Street Address"
      },
      "status": "pending",
      "paymentMethod": "upi",
      "createdAt": 1234567890
    }
  }
}
```

## Payment Integration

The application supports two payment methods:

1. **UPI Payment**:
   - UPI ID: ``
   - Manual payment confirmation required

2. **Cash on Delivery**:
   - Automatic order confirmation
   - Payment on delivery

## Security Features

- Firebase Authentication for user and admin access
- Admin role verification
- Secure file uploads to Firebase Storage
- Input validation and sanitization
- Protected admin routes

## Responsive Design

The application is fully responsive and optimized for:
- Mobile devices (320px+)
- Tablets (768px+)
- Desktop computers (1024px+)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team

## Changelog

### Version 1.0.0
- Initial release
- Complete user and admin functionality
- Firebase integration
- Mobile responsive design
- Payment system integration

