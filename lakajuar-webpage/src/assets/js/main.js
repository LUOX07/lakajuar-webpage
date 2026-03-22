document.addEventListener('DOMContentLoaded', function() {
    // Function to load products dynamically
    function loadProducts(category) {
        const productContainer = document.getElementById('product-container');
        productContainer.innerHTML = ''; // Clear existing products

        // Sample data for products (this could be replaced with an API call)
        const products = {
            accessories: [
                { name: 'Phone Case', price: 19.99, image: 'path/to/image1.jpg' },
                { name: 'Screen Protector', price: 9.99, image: 'path/to/image2.jpg' },
            ],
            jewelry: [
                { name: 'Gold Necklace', price: 49.99, image: 'path/to/image3.jpg' },
                { name: 'Silver Ring', price: 29.99, image: 'path/to/image4.jpg' },
            ]
        };

        // Create product cards based on the selected category
        products[category].forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>$${product.price.toFixed(2)}</p>
                <button class="add-to-cart">Add to Cart</button>
            `;
            productContainer.appendChild(productCard);
        });
    }

    // Event listeners for navigation
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const category = this.getAttribute('data-category');
            loadProducts(category);
        });
    });

    // Load default category on page load
    loadProducts('accessories');
});