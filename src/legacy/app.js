// Application data
const appData = {
  "restaurant": {
    "name": "The Golden Spoon",
    "welcome_message": "Welcome to The Golden Spoon - Our Signature Dishes"
  },
  "featured_dishes": [
    {
      "name": "Grilled Salmon",
      "description": "Fresh Atlantic salmon grilled to perfection with herbs and lemon",
      "price": "28.99",
      "image": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80",
      "tags": ["Chef's Special"],
      "ingredients": "Atlantic salmon, herbs, lemon, olive oil",
      "allergens": "Contains: Fish",
      "portion": "Serves 1",
      "category": "Mains"
    },
    {
      "name": "Beef Wellington",
      "description": "Tender beef wrapped in puff pastry with mushroom duxelles",
      "price": "45.99",
      "image": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80",
      "tags": ["Premium"],
      "ingredients": "Beef tenderloin, puff pastry, mushrooms, herbs",
      "allergens": "Contains: Gluten, Eggs",
      "portion": "Serves 1",
      "category": "Mains"
    },
    {
      "name": "Lobster Thermidor",
      "description": "Classic French lobster dish with creamy sauce and cheese",
      "price": "52.99",
      "image": "https://images.unsplash.com/photo-1559737558-2cc3739e4093?auto=format&fit=crop&w=400&q=80",
      "tags": ["Premium"],
      "ingredients": "Lobster, cream, cheese, herbs, brandy",
      "allergens": "Contains: Shellfish, Dairy",
      "portion": "Serves 1",
      "category": "Mains"
    },
    {
      "name": "Truffle Risotto",
      "description": "Creamy Arborio rice with black truffle and parmesan",
      "price": "38.99",
      "image": "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&q=80",
      "tags": ["Vegetarian"],
      "ingredients": "Arborio rice, black truffle, parmesan, white wine",
      "allergens": "Contains: Dairy",
      "portion": "Serves 1",
      "category": "Mains"
    },
    {
      "name": "Chocolate Lava Cake",
      "description": "Warm chocolate cake with molten center",
      "price": "12.99",
      "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80",
      "tags": ["Dessert"],
      "ingredients": "Dark chocolate, eggs, butter, flour, sugar",
      "allergens": "Contains: Gluten, Eggs, Dairy",
      "portion": "Serves 1",
      "category": "Desserts"
    }
  ],
  "menu_categories": ["Starters", "Mains", "Desserts", "Drinks"],
  "menu_items": [
    {
      "category": "Starters",
      "name": "Crispy Calamari",
      "description": "Tender calamari rings lightly battered and fried, served with marinara sauce",
      "price": "14.99",
      "image": "https://images.unsplash.com/photo-1559737558-2cc3739e4093?auto=format&fit=crop&w=400&q=80",
      "tags": ["Seafood"],
      "ingredients": "Calamari, flour, eggs, marinara sauce, herbs",
      "allergens": "Contains: Seafood, Gluten, Eggs",
      "portion": "Serves 1-2"
    },
    {
      "category": "Starters",
      "name": "Burrata Salad",
      "description": "Fresh burrata cheese with heirloom tomatoes and basil",
      "price": "16.99",
      "image": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80",
      "tags": ["Vegetarian"],
      "ingredients": "Burrata, tomatoes, basil, olive oil, balsamic",
      "allergens": "Contains: Dairy",
      "portion": "Serves 1"
    },
    {
      "category": "Mains",
      "name": "Grilled Salmon",
      "description": "Fresh Atlantic salmon grilled to perfection with herbs and lemon",
      "price": "28.99",
      "image": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80",
      "tags": ["Chef's Special"],
      "ingredients": "Atlantic salmon, herbs, lemon, olive oil",
      "allergens": "Contains: Fish",
      "portion": "Serves 1"
    },
    {
      "category": "Mains",
      "name": "Ribeye Steak",
      "description": "Prime ribeye steak cooked to your preference",
      "price": "42.99",
      "image": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80",
      "tags": ["Premium"],
      "ingredients": "Ribeye steak, herbs, garlic, butter",
      "allergens": "Contains: Dairy",
      "portion": "Serves 1"
    },
    {
      "category": "Desserts",
      "name": "Chocolate Lava Cake",
      "description": "Warm chocolate cake with molten center",
      "price": "12.99",
      "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80",
      "tags": ["Dessert"],
      "ingredients": "Dark chocolate, eggs, butter, flour, sugar",
      "allergens": "Contains: Gluten, Eggs, Dairy",
      "portion": "Serves 1"
    },
    {
      "category": "Desserts",
      "name": "Tiramisu",
      "description": "Classic Italian dessert with coffee and mascarpone",
      "price": "11.99",
      "image": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=400&q=80",
      "tags": ["Classic"],
      "ingredients": "Mascarpone, coffee, ladyfingers, cocoa",
      "allergens": "Contains: Dairy, Eggs, Gluten",
      "portion": "Serves 1"
    },
    {
      "category": "Drinks",
      "name": "House Wine",
      "description": "Selection of red and white wines",
      "price": "8.99",
      "image": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400&q=80",
      "tags": ["Alcoholic"],
      "ingredients": "Grapes, sulfites",
      "allergens": "Contains: Sulfites",
      "portion": "5oz glass"
    },
    {
      "category": "Drinks",
      "name": "Craft Beer",
      "description": "Local craft beer selection",
      "price": "6.99",
      "image": "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400&q=80",
      "tags": ["Alcoholic"],
      "ingredients": "Hops, barley, yeast",
      "allergens": "Contains: Gluten",
      "portion": "12oz bottle"
    }
  ]
};

// Modal functionality - shared function
function openDishModal(dish) {
    const modal = document.getElementById('dishModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <img src="${dish.image}" alt="${dish.name}" class="modal-image">
        <h2 class="modal-title">${dish.name}</h2>
        <p class="modal-description">${dish.description}</p>
        <div class="modal-details">
            <div class="modal-detail-item">
                <div class="modal-detail-label">Ingredientes:</div>
                <div class="modal-detail-value">${dish.ingredients}</div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Alérgenos:</div>
                <div class="modal-detail-value">${dish.allergens}</div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Porção:</div>
                <div class="modal-detail-value">${dish.portion}</div>
            </div>
        </div>
        <div class="modal-price">$${dish.price}</div>
    `;
    
    modal.classList.add('active');
}

// Carousel functionality
class Carousel {
    constructor() {
        this.currentIndex = 0;
        this.autoRotateInterval = null;
        this.isHovered = false;
        this.touchStartX = 0;
        this.touchEndX = 0;
        
        this.init();
    }
    
    init() {
        this.renderCarousel();
        this.renderIndicators();
        this.bindEvents();
        this.startAutoRotate();
        this.updateActiveCard();
    }
    
    renderCarousel() {
        const track = document.getElementById('carouselTrack');
        track.innerHTML = '';
        
        appData.featured_dishes.forEach((dish, index) => {
            const card = document.createElement('div');
            card.className = 'carousel-card';
            card.innerHTML = `
                <img src="${dish.image}" alt="${dish.name}" class="carousel-card-image">
                <div class="carousel-card-content">
                    <h3 class="carousel-card-title">${dish.name}</h3>
                    <p class="carousel-card-description">${dish.description}</p>
                    <div class="carousel-card-footer">
                        <span class="carousel-card-price">$${dish.price}</span>
                        <div class="carousel-card-tags">
                            ${dish.tags.map(tag => `<span class="carousel-card-tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => openDishModal(dish));
            track.appendChild(card);
        });
        
        this.updateCarouselPosition();
    }
    
    renderIndicators() {
        const indicators = document.getElementById('carouselIndicators');
        indicators.innerHTML = '';
        
        appData.featured_dishes.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.className = `carousel-indicator ${index === 0 ? 'active' : ''}`;
            indicator.addEventListener('click', () => this.goToSlide(index));
            indicators.appendChild(indicator);
        });
    }
    
    bindEvents() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const wrapper = document.getElementById('carouselWrapper');
        
        prevBtn.addEventListener('click', () => this.prev());
        nextBtn.addEventListener('click', () => this.next());
        
        // Hover events for auto-rotation
        wrapper.addEventListener('mouseenter', () => {
            this.isHovered = true;
            this.stopAutoRotate();
        });
        
        wrapper.addEventListener('mouseleave', () => {
            this.isHovered = false;
            this.startAutoRotate();
        });
        
        // Touch events for mobile
        wrapper.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        });
        
        wrapper.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        });
    }
    
    handleSwipe() {
        if (this.touchEndX < this.touchStartX - 50) {
            this.next();
        }
        if (this.touchEndX > this.touchStartX + 50) {
            this.prev();
        }
    }
    
    updateCarouselPosition() {
        const track = document.getElementById('carouselTrack');
        const cardWidth = window.innerWidth <= 768 ? 330 : window.innerWidth <= 1024 ? 380 : 410; // card width + margin
        const offset = -this.currentIndex * cardWidth;
        track.style.transform = `translateX(${offset}px)`;
    }
    
    updateActiveCard() {
        const cards = document.querySelectorAll('.carousel-card');
        const indicators = document.querySelectorAll('.carousel-indicator');
        
        cards.forEach((card, index) => {
            card.classList.toggle('active', index === this.currentIndex);
        });
        
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentIndex);
        });
    }
    
    next() {
        this.currentIndex = (this.currentIndex + 1) % appData.featured_dishes.length;
        this.updateCarouselPosition();
        this.updateActiveCard();
    }
    
    prev() {
        this.currentIndex = this.currentIndex === 0 ? appData.featured_dishes.length - 1 : this.currentIndex - 1;
        this.updateCarouselPosition();
        this.updateActiveCard();
    }
    
    goToSlide(index) {
        this.currentIndex = index;
        this.updateCarouselPosition();
        this.updateActiveCard();
    }
    
    startAutoRotate() {
        if (!this.isHovered) {
            this.autoRotateInterval = setInterval(() => {
                if (!this.isHovered) {
                    this.next();
                }
            }, 5000);
        }
    }
    
    stopAutoRotate() {
        if (this.autoRotateInterval) {
            clearInterval(this.autoRotateInterval);
            this.autoRotateInterval = null;
        }
    }
}

// Menu functionality
class MenuManager {
    constructor() {
        this.currentCategory = 'all';
        this.init();
    }
    
    init() {
        this.renderMenu();
        this.bindCategoryEvents();
    }
    
    renderMenu(category = 'all') {
        const menuGrid = document.getElementById('menuGrid');
        const items = category === 'all' ? appData.menu_items : appData.menu_items.filter(item => item.category === category);
        
        menuGrid.innerHTML = items.map(item => `
            <div class="menu-card" data-dish='${JSON.stringify(item)}'>
                <img src="${item.image}" alt="${item.name}" class="menu-card-image">
                <div class="menu-card-content">
                    <h3 class="menu-card-title">${item.name}</h3>
                    <p class="menu-card-description">${item.description}</p>
                    <div class="menu-card-footer">
                        <span class="menu-card-price">$${item.price}</span>
                        <div class="menu-card-tags">
                            ${item.tags ? item.tags.map(tag => `<span class="menu-card-tag">${tag}</span>`).join('') : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Bind click events to menu cards
        document.querySelectorAll('.menu-card').forEach(card => {
            card.addEventListener('click', () => {
                const dish = JSON.parse(card.dataset.dish);
                openDishModal(dish);
            });
        });
    }
    
    bindCategoryEvents() {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                this.currentCategory = category;
                
                // Update active button
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Render menu
                this.renderMenu(category);
            });
        });
    }
}

// Share functionality
function initShareButton() {
    const shareBtn = document.getElementById('shareBtn');
    
    shareBtn.addEventListener('click', async () => {
        const shareData = {
            title: 'The Golden Spoon - Menu Digital',
            text: 'Confira nosso delicioso menu!',
            url: window.location.href
        };
        
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                // Error sharing
            }
        } else {
            // Fallback - copy to clipboard
            try {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copiado para a área de transferência!');
            } catch (err) {
                // Final fallback
                const textArea = document.createElement('textarea');
                textArea.value = window.location.href;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Link copiado para a área de transferência!');
            }
        }
    });
}

// Mobile menu functionality
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    
    menuToggle.addEventListener('click', () => {
        mobileMenu.classList.add('active');
    });
    
    mobileMenuClose.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
    });
    
    // Close on outside click
    mobileMenu.addEventListener('click', (e) => {
        if (e.target === mobileMenu) {
            mobileMenu.classList.remove('active');
        }
    });
}

// Modal functionality
function initModal() {
    const modal = document.getElementById('dishModal');
    const modalClose = document.getElementById('modalClose');
    
    modalClose.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
    });
}

// Resize handler for carousel
function handleResize() {
    if (window.carousel) {
        window.carousel.updateCarouselPosition();
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    window.carousel = new Carousel();
    window.menuManager = new MenuManager();
    
    initShareButton();
    initMobileMenu();
    initModal();
    
    window.addEventListener('resize', handleResize);
});