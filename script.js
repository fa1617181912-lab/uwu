document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT & DATA PERSISTENCE ---
    let adminMenu = [];
    let adminPromos = [];
    let orders = [];
    let cart = [];
    let loggedInUser = null;
    let orderIdCounter = 1;

    const saveData = () => {
      localStorage.setItem('elhaAdminMenu', JSON.stringify(adminMenu));
      localStorage.setItem('elhaAdminPromos', JSON.stringify(adminPromos));
      localStorage.setItem('elhaOrders', JSON.stringify(orders));
      localStorage.setItem('elhaOrderIdCounter', orderIdCounter.toString());
    };

    const loadData = () => {
      adminMenu = JSON.parse(localStorage.getItem('elhaAdminMenu')) || [];
      adminPromos = JSON.parse(localStorage.getItem('elhaAdminPromos')) || [];
      orders = JSON.parse(localStorage.getItem('elhaOrders')) || [];
      orderIdCounter = parseInt(localStorage.getItem('elhaOrderIdCounter'), 10) || 1;

      // fix old orders: change 'Delivered' to 'Completed'
      orders.forEach(o => {
        if (o.status === 'Delivered') o.status = 'Completed';
      });
    };

    // --- ELEMENT SELECTORS ---
    const authContainer = document.getElementById('auth-container');
    const userDashboard = document.getElementById('dashboard');
    const adminDashboard = document.getElementById('admin-dashboard');

    // Auth
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginBox = document.getElementById('login-box');
    const signupBox = document.getElementById('signup-box');
    const signupBtn = document.getElementById('signup-btn');
    const backToLoginBtn = document.getElementById('back-to-login');

    // Dropdowns & Logout
    const userMenuToggle = document.getElementById('user-menu-toggle');
    const userDropdown = document.getElementById('user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const adminMenuToggle = document.getElementById('admin-menu-toggle');
    const adminDropdown = document.getElementById('admin-dropdown');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');

    // Page Containers
    const userPages = { home: document.getElementById('home-page'), menu: document.getElementById('menu-page'), cart: document.getElementById('cart-page'), orders: document.getElementById('orders-page') };
    const adminPages = { menu: document.getElementById('admin-menu-page'), orders: document.getElementById('admin-orders-page'), promos: document.getElementById('admin-promos-page') };

    // Nav Buttons
    const userNavButtons = { home: document.getElementById('home-btn'), menu: document.getElementById('menu-btn'), cart: document.getElementById('cart-btn'), orders: document.getElementById('orders-btn') };
    const adminNavButtons = { menu: document.getElementById('admin-menu-btn'), orders: document.getElementById('admin-orders-btn'), promos: document.getElementById('admin-promos-btn') };

    // Search
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const clearFilterBtn = document.getElementById('clear-filter-btn');

    // User Home Page Lists
    const promoList = document.getElementById('promo-list');
    const featuredList = document.getElementById('featured-list');
    const categoryList = document.getElementById('category-list');
    const popularList = document.getElementById('popular-list');
    const newList = document.getElementById('new-list');

    // User Menu Page
    const userMenuList = document.getElementById('user-menu-list');
    const menuTitle = document.getElementById('menu-title');

    // Cart
    const cartItemsList = document.getElementById('cart-items');
    const cartTotalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    // Orders
    const userOrdersList = document.getElementById('user-orders-list');
    const adminOrdersTableBody = document.querySelector('#orders-table tbody');
    const orderSearchInput = document.getElementById('order-search');

    // Admin Menu Form
    const addDishForm = document.getElementById('add-dish-form');
    const adminDishList = document.getElementById('admin-dish-list');
    const adminFormTitle = document.getElementById('admin-form-title');
    const addDishBtn = document.getElementById('add-dish-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const dishEditIndexInput = document.getElementById('dish-edit-index');

    // Admin Promos Form
    const addPromoForm = document.getElementById('add-promo-form');
    const adminPromoList = document.getElementById('admin-promo-list');

    // Modal Elements
    const modalOverlay = document.getElementById('modal-overlay');
    const paymentChoiceView = document.getElementById('payment-choice-view');
    const onlinePaymentView = document.getElementById('online-payment-view');
    const cashierConfirmView = document.getElementById('cashier-confirm-view');
    const receiptView = document.getElementById('receipt-view');
    const onlinePaymentBtn = document.getElementById('online-payment-btn');
    const cashierBtn = document.getElementById('cashier-btn');
    const payNowBtn = document.getElementById('pay-now-btn');
    const downloadReceiptBtn = document.getElementById('download-receipt-btn');

    // --- RENDER FUNCTIONS ---
    const renderHome = () => {
      promoList.innerHTML = '';
      featuredList.innerHTML = '';
      popularList.innerHTML = '';
      newList.innerHTML = '';
      categoryList.innerHTML = '';

      adminPromos.forEach(p => {
          promoList.innerHTML += `
              <div class="teaser-box">
                  <img src="${p.img}" alt="${p.title}">
                  <strong>${p.title}</strong>
                  <p>${p.desc}</p>
              </div>`;
      });

      adminMenu.forEach(dish => {
          const dishTeaser = `
              <div class="teaser-box" data-category="${dish.category}">
                  <img src="${dish.img}" alt="${dish.name}">
                  <strong>${dish.name}</strong>
                  <p>₱${dish.price}</p>
              </div>`;
          if (dish.tags.includes('featured')) featuredList.innerHTML += dishTeaser;
          if (dish.tags.includes('popular')) popularList.innerHTML += dishTeaser;
          if (dish.tags.includes('new')) newList.innerHTML += dishTeaser;
      });

      const categories = [...new Set(adminMenu.map(d => d.category))];
      categories.forEach(cat => {
          categoryList.innerHTML += `
              <div class="teaser-box" data-category="${cat}">
                  <strong>${cat}</strong>
              </div>`;
      });
    };

    const renderUserMenu = (filter = {}) => {
      userMenuList.innerHTML = "";
      let filteredMenu = [...adminMenu];

      if (filter.category) {
        filteredMenu = filteredMenu.filter(dish => dish.category === filter.category);
        menuTitle.textContent = `${filter.category} Dishes`;
        clearFilterBtn.classList.remove('hidden');
      } else if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        filteredMenu = filteredMenu.filter(dish => dish.name.toLowerCase().includes(query) || dish.desc.toLowerCase().includes(query));
        menuTitle.textContent = `Search Results for "${filter.searchQuery}"`;
        clearFilterBtn.classList.remove('hidden');
      } else {
        menuTitle.textContent = "Our Dishes";
        clearFilterBtn.classList.add('hidden');
      }
      
      if (filteredMenu.length === 0) {
          userMenuList.innerHTML = "<p>No dishes found.</p>";
          return;
      }

      const dishesByCategory = filteredMenu.reduce((acc, dish) => {
          if (!acc[dish.category]) acc[dish.category] = [];
          acc[dish.category].push(dish);
          return acc;
      }, {});

      for (const category in dishesByCategory) {
          const section = document.createElement('section');
          section.classList.add('menu-section');
          section.innerHTML = `<h3>${category}</h3>`;
          dishesByCategory[category].forEach((dish, index) => {
              section.innerHTML += `
                  <div class="menu-item" data-id="${adminMenu.indexOf(dish)}">
                      <img src="${dish.img}" alt="${dish.name}">
                      <div class="menu-info">
                          <h4>${dish.name}</h4>
                          <p>${dish.desc}</p>
                          <p class="price">₱${dish.price}</p>
                          <div class="menu-actions">
                             <button class="add-to-cart-btn">Add to Cart</button>
                          </div>
                      </div>
                  </div>`;
          });
          userMenuList.appendChild(section);
      }
    };

    const updateCart = () => {
      cartItemsList.innerHTML = '';
      if (cart.length === 0) {
          cartItemsList.innerHTML = "<li>No items yet.</li>";
          cartTotalEl.textContent = "Total: ₱0";
          return;
      }
      let total = 0;
      cart.forEach((item, index) => {
          total += item.price;
          cartItemsList.innerHTML += `
              <li>
                  <span>${item.name} - ₱${item.price}</span>
                  <button class="remove-item" data-index="${index}">✖</button>
              </li>`;
      });
      cartTotalEl.textContent = `Total: ₱${total}`;
    };

    const renderAdminMenu = () => {
      adminDishList.innerHTML = '';
      if (adminMenu.length === 0) { adminDishList.innerHTML = "<p>No dishes yet.</p>"; return; }
      adminMenu.forEach((dish, index) => {
          adminDishList.innerHTML += `
              <div class="menu-item">
                  <img src="${dish.img}" alt="${dish.name}">
                  <div class="menu-info">
                      <h4>${dish.name}</h4>
                      <p>${dish.desc}</p>
                      <p><strong>Category:</strong> ${dish.category} | <strong>Tags:</strong> ${dish.tags.join(', ')}</p>
                      <p class="price">₱${dish.price}</p>
                      <div class="menu-actions">
                          <button class="edit-btn" data-index="${index}">Edit</button>
                          <button class="delete-btn" data-index="${index}">Delete</button>
                      </div>
                  </div>
              </div>`;
      });
    };

    const renderAdminPromos = () => {
      adminPromoList.innerHTML = '';
      if (adminPromos.length === 0) { adminPromoList.innerHTML = "<p>No promos yet.</p>"; return; }
      adminPromos.forEach((promo, index) => {
          adminPromoList.innerHTML += `
               <div class="menu-item">
                  <img src="${promo.img}" alt="${promo.title}">
                  <div class="menu-info">
                      <h4>${promo.title}</h4>
                      <p>${promo.desc}</p>
                      <div class="menu-actions">
                          <button class="delete-promo-btn" data-index="${index}">Delete</button>
                      </div>
                  </div>
              </div>`;
      });
    };

    const renderAdminOrders = (filterQuery = '') => {
      adminOrdersTableBody.innerHTML = '';
      const filteredOrders = orders.filter(o => 
          o.customer.toLowerCase().includes(filterQuery.toLowerCase()) || 
          o.id.toString().includes(filterQuery)
      );

      if (filteredOrders.length === 0) {
          adminOrdersTableBody.innerHTML = '<tr><td colspan="6">No orders found.</td></tr>';
          return;
      }

      filteredOrders.forEach(order => {
          const itemsString = order.items.map(i => i.name).join(', ');
          const statusOptions = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled']
              .map(s => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${s}</option>`).join('');

          const disabledAttr = (order.status === 'Completed' || order.status === 'Cancelled') ? 'disabled' : '';

          adminOrdersTableBody.innerHTML += `
              <tr data-id="${order.id}">
                  <td>${order.id}</td>
                  <td>${order.customer}</td>
                  <td>${itemsString}</td>
                  <td>₱${order.total}</td>
                  <td><span class="status">${order.status}</span></td>
                  <td>
                      <select class="status-select" ${disabledAttr}>
                          ${statusOptions}
                      </select>
                  </td>
              </tr>`;
      });
    };

    const renderUserOrders = () => {
      userOrdersList.innerHTML = '';
      const userOrders = orders.filter(o => o.customer === loggedInUser.name);
      if (userOrders.length === 0) {
          userOrdersList.innerHTML = '<p>You have no active orders.</p>';
          return;
      }
      userOrders.forEach(order => {
          userOrdersList.innerHTML += `
              <div class="order-card">
                  <h4>Order #${order.id}</h4>
                  <p><strong>Total:</strong> ₱${order.total}</p>
                  <p><strong>Items:</strong> ${order.items.map(i => i.name).join(', ')}</p>
                  <p><strong>Status:</strong> <span class="status">${order.status}</span></p>
              </div>`;
      });
    };

    // --- NAVIGATION & EVENT HANDLERS ---
    const showPage = (pageKey) => {
      Object.values(userPages).forEach(p => p.classList.add('hidden'));
      Object.values(userNavButtons).forEach(b => b.classList.remove('active'));
      userPages[pageKey].classList.remove('hidden');
      userNavButtons[pageKey].classList.add('active');
    };

    const showAdminPage = (pageKey) => {
      Object.values(adminPages).forEach(p => p.classList.add('hidden'));
      Object.values(adminNavButtons).forEach(b => b.classList.remove('active'));
      adminPages[pageKey].classList.remove('hidden');
      adminNavButtons[pageKey].classList.add('active');
    };

    const logout = () => {
        loggedInUser = null;
        cart = [];
        updateCart();
        userDashboard.classList.add('hidden');
        adminDashboard.classList.add('hidden');
        authContainer.classList.remove('hidden');
    };

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = e.target.elements['login-email'].value;
      const password = e.target.elements['login-password'].value;
      if (email === "admin@elha.com" && password === "admin123") {
          loggedInUser = { name: 'Admin', email };
          authContainer.classList.add('hidden');
          adminDashboard.classList.remove('hidden');
          showAdminPage('menu');
          renderAdminMenu();
      } else {
          loggedInUser = { name: 'Valued Customer', email };
          authContainer.classList.add('hidden');
          userDashboard.classList.remove('hidden');
          showPage('home');
          renderHome();
      }
      loginForm.reset();
    });

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loggedInUser = { name: e.target.elements['signup-name'].value, email: e.target.elements['signup-email'].value };
        authContainer.classList.add('hidden');
        userDashboard.classList.remove('hidden');
        showPage('home');
        renderHome();
        signupForm.reset();
        signupBox.classList.add('hidden');
        loginBox.classList.remove('hidden');
    });

    signupBtn.addEventListener('click', () => {
      loginBox.classList.add('hidden');
      signupBox.classList.remove('hidden');
    });

    backToLoginBtn.addEventListener('click', () => {
      signupBox.classList.add('hidden');
      loginBox.classList.remove('hidden');
    });

    logoutBtn.addEventListener('click', logout);
    adminLogoutBtn.addEventListener('click', logout);

    userMenuToggle.addEventListener('click', () => userDropdown.classList.toggle('hidden'));
    adminMenuToggle.addEventListener('click', () => adminDropdown.classList.toggle('hidden'));
    window.addEventListener('click', (e) => {
      if (!userMenuToggle.contains(e.target) && !userDropdown.contains(e.target)) userDropdown.classList.add('hidden');
      if (!adminMenuToggle.contains(e.target) && !adminDropdown.contains(e.target)) adminDropdown.classList.add('hidden');
    });

    userNavButtons.home.addEventListener('click', () => { showPage('home'); renderHome(); });
    userNavButtons.menu.addEventListener('click', () => { showPage('menu'); renderUserMenu(); });
    userNavButtons.cart.addEventListener('click', () => { showPage('cart'); updateCart(); });
    userNavButtons.orders.addEventListener('click', () => { showPage('orders'); renderUserOrders(); });

    adminNavButtons.menu.addEventListener('click', () => { showAdminPage('menu'); renderAdminMenu(); });
    adminNavButtons.orders.addEventListener('click', () => { showAdminPage('orders'); renderAdminOrders(); });
    adminNavButtons.promos.addEventListener('click', () => { showAdminPage('promos'); renderAdminPromos(); });

    searchBtn.addEventListener('click', () => {
        if (searchInput.value.trim()) {
            showPage('menu');
            renderUserMenu({ searchQuery: searchInput.value.trim() });
        }
    });
    searchInput.addEventListener('keyup', (e) => { if(e.key === 'Enter') searchBtn.click(); });

    clearFilterBtn.addEventListener('click', () => {
        searchInput.value = '';
        renderUserMenu();
    });

    categoryList.addEventListener('click', e => {
        const categoryBox = e.target.closest('.teaser-box');
        if (categoryBox && categoryBox.dataset.category) {
            showPage('menu');
            renderUserMenu({ category: categoryBox.dataset.category });
        }
    });

    userMenuList.addEventListener('click', e => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const menuItemEl = e.target.closest('.menu-item');
            const dishIndex = parseInt(menuItemEl.dataset.id, 10);
            const dish = adminMenu[dishIndex];
            cart.push(dish);
            updateCart();
            alert(`${dish.name} added to cart!`);
        }
    });

    cartItemsList.addEventListener('click', e => {
        if (e.target.classList.contains('remove-item')) {
            const index = parseInt(e.target.dataset.index, 10);
            cart.splice(index, 1);
            updateCart();
        }
    });

    cancelBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your cart?')) {
            cart = [];
            updateCart();
        }
    });

    // --- UTILITY & MODAL FUNCTIONS ---

    const resetModal = () => {
      // Hide all views except the initial choice view
      paymentChoiceView.classList.remove('hidden');
      onlinePaymentView.classList.add('hidden');
      cashierConfirmView.classList.add('hidden');
      receiptView.classList.add('hidden');
      modalOverlay.classList.add('hidden');
    };
    
    const processOrder = (paymentMethod) => {
        const newOrder = {
            id: orderIdCounter++,
            customer: loggedInUser.name,
            items: [...cart],
            total: cart.reduce((sum, item) => sum + item.price, 0),
            status: 'Pending',
            paymentMethod: paymentMethod
        };
        orders.push(newOrder);
        saveData();
        cart = [];
        updateCart();
        return newOrder; // Return the order for the receipt
    };

    const generateAndShowReceipt = (order) => {
        const receiptContent = document.getElementById('receipt-content');
        const itemsHtml = order.items.map(item => `<p>${item.name} ..... ₱${item.price}</p>`).join('');

        receiptContent.innerHTML = `
            <h4>Elha's Eatery - Official Receipt</h4>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Customer:</strong> ${order.customer}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <div class="items-list">
                ${itemsHtml}
            </div>
            <p class="total">Total Paid: ₱${order.total}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        `;

        paymentChoiceView.classList.add('hidden');
        onlinePaymentView.classList.add('hidden');
        receiptView.classList.remove('hidden');
    };

    // --- CHECKOUT & MODAL EVENT LISTENERS ---

    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert("Your cart is empty!");
            return;
        }
        // Open the modal instead of the old checkout logic
        modalOverlay.classList.remove('hidden');
    });

    modalOverlay.addEventListener('click', (e) => {
        // Close modal if overlay (background) or a close button is clicked
        if (e.target.id === 'modal-overlay' || e.target.classList.contains('close-modal-btn') || e.target.id === 'close-confirm-btn' || e.target.id === 'close-receipt-btn') {
            resetModal();
            // After closing, navigate to orders page to see the new order
            if (!paymentChoiceView.classList.contains('hidden')) return; // Don't switch page if no action was taken
            showPage('orders');
            renderUserOrders();
        }
    });

    cashierBtn.addEventListener('click', () => {
        processOrder('Pay at Cashier');
        paymentChoiceView.classList.add('hidden');
        cashierConfirmView.classList.remove('hidden');
    });

    onlinePaymentBtn.addEventListener('click', () => {
        paymentChoiceView.classList.add('hidden');
        onlinePaymentView.classList.remove('hidden');
    });
    
    payNowBtn.addEventListener('click', () => {
        const provider = document.getElementById('online-provider-select').value;
        const newOrder = processOrder(provider);
        generateAndShowReceipt(newOrder);
    });

    downloadReceiptBtn.addEventListener('click', () => {
        const receiptContent = document.getElementById('receipt-content').innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html><head><title>Elha's Eatery Receipt</title>
            <style>
                body { font-family: Arial, sans-serif; }
                .receipt { border: 1px dashed #555; padding: 20px; width: 300px; margin: 20px auto; }
                .receipt h4 { text-align: center; margin-bottom: 10px; }
                .receipt p { font-size: 14px; margin-bottom: 5px; line-height: 1.5; }
                .items-list { margin: 15px 0; padding-top: 10px; border-top: 1px solid #ccc; }
                .total { font-weight: bold; font-size: 16px; margin-top: 15px; padding-top: 10px; border-top: 1px solid #ccc; }
            </style>
            </head><body>
                <div class="receipt">${receiptContent}</div>
                <script>window.print(); window.close();</script>
            </body></html>
        `);
        printWindow.document.close();
    });

    // --- ADMIN FORM LISTENERS ---

    addDishForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const editIndex = dishEditIndexInput.value;
      const dish = {
          name: document.getElementById('dish-name').value,
          desc: document.getElementById('dish-desc').value,
          price: parseInt(document.getElementById('dish-price').value, 10),
          img: document.getElementById('dish-img').value,
          category: document.getElementById('dish-category').value,
          tags: [
              document.getElementById('tag-featured').checked && 'featured',
              document.getElementById('tag-popular').checked && 'popular',
              document.getElementById('tag-new').checked && 'new'
          ].filter(Boolean)
      };

      if (editIndex) {
          adminMenu[editIndex] = dish;
          alert('Dish updated successfully!');
      } else {
          adminMenu.push(dish);
          alert('Dish added successfully!');
      }

      saveData();
      renderAdminMenu();
      addDishForm.reset();
      dishEditIndexInput.value = '';
      adminFormTitle.textContent = 'Add a New Dish';
      addDishBtn.textContent = '+ Add Dish';
      cancelEditBtn.classList.add('hidden');
    });

    adminDishList.addEventListener('click', e => {
      const index = e.target.dataset.index;
      if (e.target.classList.contains('delete-btn')) {
          if (confirm(`Delete ${adminMenu[index].name}?`)) {
              adminMenu.splice(index, 1);
              saveData();
              renderAdminMenu();
          }
      } else if (e.target.classList.contains('edit-btn')) {
          const dish = adminMenu[index];
          dishEditIndexInput.value = index;
          document.getElementById('dish-name').value = dish.name;
          document.getElementById('dish-desc').value = dish.desc;
          document.getElementById('dish-price').value = dish.price;
          document.getElementById('dish-img').value = dish.img;
          document.getElementById('dish-category').value = dish.category;
          document.getElementById('tag-featured').checked = dish.tags.includes('featured');
          document.getElementById('tag-popular').checked = dish.tags.includes('popular');
          document.getElementById('tag-new').checked = dish.tags.includes('new');
          
          adminFormTitle.textContent = `Editing: ${dish.name}`;
          addDishBtn.textContent = 'Update Dish';
          cancelEditBtn.classList.remove('hidden');
          window.scrollTo(0, 0);
      }
    });
    
    cancelEditBtn.addEventListener('click', () => {
        addDishForm.reset();
        dishEditIndexInput.value = '';
        adminFormTitle.textContent = 'Add a New Dish';
        addDishBtn.textContent = '+ Add Dish';
        cancelEditBtn.classList.add('hidden');
    });

    addPromoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newPromo = {
            title: document.getElementById('promo-title').value,
            desc: document.getElementById('promo-desc').value,
            img: document.getElementById('promo-img').value,
        };
        adminPromos.push(newPromo);
        saveData();
        renderAdminPromos();
        addPromoForm.reset();
        alert('Promotion added!');
    });

    adminPromoList.addEventListener('click', e => {
        if (e.target.classList.contains('delete-promo-btn')) {
            const index = e.target.dataset.index;
            if (confirm('Delete this promotion?')) {
                adminPromos.splice(index, 1);
                saveData();
                renderAdminPromos();
            }
        }
    });

    orderSearchInput.addEventListener('input', () => renderAdminOrders(orderSearchInput.value));

    adminOrdersTableBody.addEventListener('change', e => {
        if (e.target.classList.contains('status-select')) {
            const orderId = e.target.closest('tr').dataset.id;
            const order = orders.find(o => o.id == orderId);
            if (order) {
                order.status = e.target.value;
                saveData();
                renderAdminOrders(orderSearchInput.value);
            }
        }
    });

    const init = () => {
      loadData();
      authContainer.classList.remove('hidden');
      userDashboard.classList.add('hidden');
      adminDashboard.classList.add('hidden');
    };

    init();

});