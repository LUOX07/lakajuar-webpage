document.addEventListener('DOMContentLoaded', function() {
    const phoneAccessoriesSection = document.getElementById('phone-accessories');
    const jewelrySection = document.getElementById('jewelry');

    // Sample data for phone accessories
    const phoneAccessories = [
        { name: 'Phone Case', price: '$15.99', image: 'images/phone-case.jpg' },
        { name: 'Screen Protector', price: '$9.99', image: 'images/screen-protector.jpg' },
        { name: 'Charging Cable', price: '$12.99', image: 'images/charging-cable.jpg' }
    ];

    // Sample data for jewelry
    const jewelryItems = [
        { name: 'Necklace', price: '$29.99', image: 'images/necklace.jpg' },
        { name: 'Bracelet', price: '$19.99', image: 'images/bracelet.jpg' },
        { name: 'Earrings', price: '$24.99', image: 'images/earrings.jpg' }
    ];

    function displayProducts(section, products) {
        products.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.classList.add('product');

            const productImage = document.createElement('img');
            productImage.src = product.image;
            productImage.alt = product.name;

            const productName = document.createElement('h3');
            productName.textContent = product.name;

            const productPrice = document.createElement('p');
            productPrice.textContent = product.price;

            productDiv.appendChild(productImage);
            productDiv.appendChild(productName);
            productDiv.appendChild(productPrice);
            section.appendChild(productDiv);
        });
    }

    displayProducts(phoneAccessoriesSection, phoneAccessories);
    displayProducts(jewelrySection, jewelryItems);
});