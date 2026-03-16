(function () {
  'use strict';

  // Intégration Telegram WebApp (si disponible)
  var tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
  if (tg) {
    try {
      tg.ready();
      tg.expand(); // ouverture en plein écran dans Telegram
      if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        console.log('Bonjour, ' + tg.initDataUnsafe.user.first_name);
      }
    } catch (e) {
      console.log('Telegram WebApp init error:', e);
      tg = null;
    }
  }

  const panels = document.querySelectorAll('.panel');
  const navItems = document.querySelectorAll('.nav-item');
  const cartBadge = document.getElementById('cart-badge');
  const cartEmpty = document.getElementById('cart-empty');
  const cartItemsWrap = document.getElementById('cart-items-wrap');
  const cartItems = document.getElementById('cart-items');
  const cartTotalPrice = document.getElementById('cart-total-price');
  const productCount = document.getElementById('product-count');
  const productsGrid = document.getElementById('products-grid');
  const searchInput = document.getElementById('search-products');
  const checkoutFormWrap = document.getElementById('checkout-form-wrap');
  const checkoutForm = document.getElementById('checkout-form');

  const detailPanel = document.getElementById('detail-produit');
  const detailTitle = document.getElementById('detail-title');
  const detailOrigin = document.getElementById('detail-origin');
  const detailTags = document.getElementById('detail-tags');
  const detailDescription = document.getElementById('detail-description');
  const detailQuantities = document.getElementById('detail-quantities');
  const detailMainMedia = document.getElementById('detail-main-media');
  const detailThumbs = document.getElementById('detail-thumbs');
  const detailAddToCart = document.getElementById('detail-add-to-cart');

  let cart = [];
  let reviews = [
    { name: 'Client A.', date: 'Hier', stars: 5, text: 'Super produit, livraison rapide. Je recommande !' },
    { name: 'Client B.', date: 'Il y a 2 jours', stars: 5, text: 'Très satisfait du service et de la qualité.' }
  ];
  let currentCategory = 'all';
  let currentMarque = 'all';

  const productsData = {
    '1': {
      id: '1',
      name: 'Jaune Mousseux',
      origin: 'Maroc',
      tags: ['Nouveau'],
      description: 'Un jaune mousseux très aromatique, sélectionné pour les amateurs de sensations gourmandes.',
      media: [
        { type: 'image', src: '', label: 'Photo 1' },
        { type: 'image', src: '', label: 'Photo 2' },
        { type: 'video', src: '', label: 'Vidéo' }
      ],
      quantities: [
        { amount: '5G', price: 20 },
        { amount: '10G', price: 40 },
        { amount: '25G', price: 80 },
        { amount: '50G', price: 150 },
        { amount: '100G', price: 250 },
        { amount: '500G', price: 1200 }
      ]
    },
    '2': {
      id: '2',
      name: '2× Filtre',
      origin: 'Espagne',
      tags: ['Populaire'],
      description: 'Double filtre pour une expérience douce et régulière.',
      media: [
        { type: 'image', src: '', label: 'Photo 1' },
        { type: 'image', src: '', label: 'Photo 2' },
        { type: 'image', src: '', label: 'Photo 3' }
      ],
      quantities: [
        { amount: '5G', price: 30 },
        { amount: '10G', price: 60 },
        { amount: '25G', price: 90 },
        { amount: '50G', price: 180 },
        { amount: '100G', price: 300 }
      ]
    },
    '3': {
      id: '3',
      name: 'Coco Acai',
      origin: 'Guadeloupe',
      tags: ['Exotique'],
      description: 'Mélange tropical coco & açaï, idéal pour les sessions fruitées.',
      media: [
        { type: 'image', src: '', label: 'Photo 1' },
        { type: 'image', src: '', label: 'Photo 2' },
        { type: 'video', src: '', label: 'Vidéo' }
      ],
      quantities: [
        { amount: '1G', price: 50 },
        { amount: '5G', price: 230 },
        { amount: '10G', price: 400 },
        { amount: '50G', price: 1400 },
        { amount: '100G', price: 2500 }
      ]
    },
    '4': {
      id: '4',
      name: '3× Filtre',
      origin: 'Espagne',
      tags: ['Premium'],
      description: 'Triple filtre haut de gamme pour les connaisseurs.',
      media: [
        { type: 'image', src: '', label: 'Photo 1' },
        { type: 'image', src: '', label: 'Photo 2' },
        { type: 'image', src: '', label: 'Photo 3' }
      ],
      quantities: [
        { amount: '5G', price: 90 },
        { amount: '10G', price: 170 },
        { amount: '25G', price: 380 },
        { amount: '50G', price: 700 }
      ]
    }
  };

  let currentDetailProductId = null;
  let currentDetailQty = null;
  let currentDetailMediaIndex = 0;

  function showPanel(panelId) {
    panels.forEach(function (p) {
      p.classList.toggle('active', p.id === panelId);
    });
    navItems.forEach(function (btn) {
      var isActive = btn.getAttribute('data-panel') === panelId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-current', isActive ? 'page' : null);
    });
  }

  navItems.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panelId = btn.getAttribute('data-panel');
      showPanel(panelId);
      if (panelId === 'panier') renderCart();
      if (panelId === 'avis') renderReviews();
    });
  });

  document.getElementById('btn-discover-products').addEventListener('click', function () {
    showPanel('accueil');
  });

  function updateProductCount() {
    var cards = productsGrid.querySelectorAll('.product-card:not(.hidden)');
    productCount.textContent = cards.length;
  }

  function filterProducts() {
    var q = (searchInput.value || '').trim().toLowerCase();
    var cards = productsGrid.querySelectorAll('.product-card');
    cards.forEach(function (card) {
      var cat = card.getAttribute('data-category');
      var marque = card.getAttribute('data-marque');
      var name = (card.querySelector('.product-name') || {}).textContent || '';
      var matchCat = currentCategory === 'all' || cat === currentCategory;
      var matchMarque = currentMarque === 'all' || marque === currentMarque;
      var matchSearch = !q || name.toLowerCase().indexOf(q) >= 0;
      card.classList.toggle('hidden', !(matchCat && matchMarque && matchSearch));
    });
    updateProductCount();
  }

  searchInput.addEventListener('input', filterProducts);

  function setupDropdown(btnId, dropdownId, setFilter) {
    var btn = document.getElementById(btnId);
    var dropdown = document.getElementById(dropdownId);
    if (!btn || !dropdown) return;
    dropdown.addEventListener('click', function (e) { e.stopPropagation(); });
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !expanded);
      dropdown.hidden = expanded;
    });
    dropdown.querySelectorAll('button[role="option"]').forEach(function (option) {
      option.addEventListener('click', function () {
        setFilter(option.getAttribute('data-filter'));
        btn.textContent = option.textContent.trim() + ' \u25BC';
        dropdown.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
        filterProducts();
      });
    });
  }

  setupDropdown('btn-categories', 'dropdown-categories', function (v) { currentCategory = v; });
  setupDropdown('btn-marques', 'dropdown-marques', function (v) { currentMarque = v; });

  document.addEventListener('click', function () {
    document.querySelectorAll('.dropdown').forEach(function (d) {
      d.hidden = true;
    });
    document.querySelectorAll('.filter-btn').forEach(function (b) {
      b.setAttribute('aria-expanded', 'false');
    });
  });

  productsGrid.addEventListener('click', function (e) {
    var addBtn = e.target.closest('.btn-add-cart');
    if (addBtn) {
      var idBtn = addBtn.getAttribute('data-id');
      var cardBtn = addBtn.closest('.product-card');
      var nameBtn = (cardBtn.querySelector('.product-name') || {}).textContent || 'Produit ' + idBtn;
      addToCart({ id: idBtn, name: nameBtn, price: 0 });
      return;
    }
    var card = e.target.closest('.product-card');
    if (!card) return;
    var id = card.getAttribute('data-id');
    openProductDetail(id);
  });

  function openProductDetail(id) {
    if (!productsData[id]) return;
    currentDetailProductId = id;
    currentDetailQty = null;
    currentDetailMediaIndex = 0;

    var data = productsData[id];
    detailTitle.textContent = data.name;
    detailOrigin.textContent = data.origin;
    detailDescription.textContent = data.description;

    detailTags.innerHTML = (data.tags || []).map(function (tag) {
      return '<span class="detail-tag">' + escapeHtml(tag) + '</span>';
    }).join('');

    detailQuantities.innerHTML = (data.quantities || []).map(function (q, index) {
      return (
        '<button type="button" class="detail-qty-card" data-amount="' + escapeHtml(q.amount) + '" data-price="' + q.price + '" data-index="' + index + '">' +
        '<span class="detail-qty-amount">' + escapeHtml(q.amount) + '</span>' +
        '<span class="detail-qty-price">' + q.price.toFixed(2) + ' €</span>' +
        '</button>'
      );
    }).join('');

    Array.prototype.forEach.call(detailQuantities.querySelectorAll('.detail-qty-card'), function (btn) {
      btn.addEventListener('click', function () {
        detailQuantities.querySelectorAll('.detail-qty-card').forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        currentDetailQty = {
          amount: btn.getAttribute('data-amount'),
          price: parseFloat(btn.getAttribute('data-price'))
        };
      });
    });

    renderDetailMedia(data);
    showPanel('detail-produit');
  }

  function renderDetailMedia(data) {
    var mediaList = data.media || [];
    if (!mediaList.length) {
      detailMainMedia.innerHTML = '<span>Aucun média disponible</span>';
      detailThumbs.innerHTML = '';
      return;
    }
    var main = mediaList[currentDetailMediaIndex] || mediaList[0];
    detailMainMedia.innerHTML = '';
    var elMain;
    if (main.type === 'video') {
      elMain = document.createElement('div');
      elMain.textContent = 'Aperçu vidéo';
    } else {
      elMain = document.createElement('div');
      elMain.textContent = 'Aperçu image';
    }
    detailMainMedia.appendChild(elMain);

    detailThumbs.innerHTML = '';
    mediaList.slice(0, 3).forEach(function (m, index) {
      var thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = 'detail-thumb' + (index === currentDetailMediaIndex ? ' active' : '');
      thumb.setAttribute('data-label', m.label || (m.type === 'video' ? 'Vidéo' : 'Photo'));
      thumb.addEventListener('click', function () {
        currentDetailMediaIndex = index;
        renderDetailMedia(data);
      });
      detailThumbs.appendChild(thumb);
    });
  }

  document.getElementById('btn-back-to-accueil').addEventListener('click', function () {
    showPanel('accueil');
  });

  document.getElementById('detail-prev-media').addEventListener('click', function () {
    if (!currentDetailProductId) return;
    var data = productsData[currentDetailProductId];
    if (!data || !data.media || !data.media.length) return;
    currentDetailMediaIndex = (currentDetailMediaIndex - 1 + data.media.length) % data.media.length;
    renderDetailMedia(data);
  });

  document.getElementById('detail-next-media').addEventListener('click', function () {
    if (!currentDetailProductId) return;
    var data = productsData[currentDetailProductId];
    if (!data || !data.media || !data.media.length) return;
    currentDetailMediaIndex = (currentDetailMediaIndex + 1) % data.media.length;
    renderDetailMedia(data);
  });

  detailAddToCart.addEventListener('click', function () {
    if (!currentDetailProductId) return;
    var baseProduct = productsData[currentDetailProductId];
    var name = baseProduct.name;
    var price = 0;
    var labelAmount = '';
    if (currentDetailQty) {
      price = currentDetailQty.price || 0;
      labelAmount = ' (' + currentDetailQty.amount + ')';
    }
    addToCart({ id: currentDetailProductId + labelAmount, name: name + labelAmount, price: price });
    alert('Produit ajouté au panier.');
  });

  function addToCart(product) {
    var existing = cart.find(function (p) { return p.id === product.id; });
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      cart.push({ id: product.id, name: product.name, price: product.price || 0, qty: 1 });
    }
    updateCartBadge();
  }

  function updateCartBadge() {
    var total = cart.reduce(function (s, p) { return s + (p.qty || 1); }, 0);
    cartBadge.textContent = total;
    cartBadge.hidden = total === 0;
  }

  function renderCart() {
    if (cart.length === 0) {
      cartEmpty.hidden = false;
      cartItemsWrap.hidden = true;
      checkoutFormWrap.hidden = true;
      return;
    }
    cartEmpty.hidden = true;
    cartItemsWrap.hidden = false;
    cartItems.innerHTML = cart.map(function (item) {
      return (
        '<li class="cart-item" data-id="' + item.id + '">' +
        '<span class="cart-item-name">' + escapeHtml(item.name) + '</span>' +
        '<span class="cart-item-qty">x' + (item.qty || 1) + '</span>' +
        '<button type="button" class="cart-item-remove" aria-label="Retirer">\u00D7</button>' +
        '</li>'
      );
    }).join('');
    var total = cart.reduce(function (s, p) { return s + (p.price || 0) * (p.qty || 1); }, 0);
    cartTotalPrice.textContent = total + ' \u20AC';
    cartItems.querySelectorAll('.cart-item-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.closest('.cart-item').getAttribute('data-id');
        cart = cart.filter(function (p) { return p.id !== id; });
        updateCartBadge();
        renderCart();
      });
    });
    checkoutFormWrap.hidden = true;
  }

  document.getElementById('btn-checkout').addEventListener('click', function () {
    checkoutFormWrap.hidden = false;
  });

  document.getElementById('btn-cancel-checkout').addEventListener('click', function () {
    checkoutFormWrap.hidden = true;
  });

  // Bloque temporairement les liens réseaux sociaux
  document.querySelectorAll('[data-disabled="true"]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      alert('Bientôt disponible.');
    });
  });

  checkoutForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.target;
    var data = new FormData(form);
    var obj = {};
    data.forEach(function (v, k) { obj[k] = v; });
    obj.items = cart.map(function (p) {
      return { id: p.id, name: p.name, qty: p.qty || 1, price: p.price || 0 };
    });
    obj.total = cart.reduce(function (s, p) { return s + (p.price || 0) * (p.qty || 1); }, 0);

    // Envoi des infos au bot Telegram (le bot pourra ensuite poster dans un canal)
    if (tg) {
      try {
        tg.sendData(JSON.stringify(obj));
        // Important: ferme la mini-app, ce qui "retourne" les données au bot
        setTimeout(function () { tg.close(); }, 150);
      } catch (err) {
        console.log('Telegram sendData error:', err);
        alert("Erreur Telegram lors de l'envoi. Ouvre la console et renvoie-moi le message d'erreur.");
      }
    } else {
      alert("Telegram WebApp non détecté. Ouvre le site via le bouton Menu du bot.");
    }

    console.log('Commande:', obj);
    alert('Commande enregistrée (démo).');
    checkoutFormWrap.hidden = true;
    form.reset();
  });

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function renderReviews() {
    var avg = reviews.length
      ? (reviews.reduce(function (s, r) { return s + r.stars; }, 0) / reviews.length).toFixed(1)
      : '0';
    document.getElementById('avg-rating').textContent = avg;
    document.getElementById('reviews-count').textContent = reviews.length + ' avis';
    var summary = document.getElementById('stars-summary');
    summary.innerHTML = '';
    for (var i = 0; i < 5; i++) {
      var star = document.createElement('span');
      star.textContent = '\u2605';
      star.style.color = i < Math.round(parseFloat(avg)) ? 'var(--accent)' : 'var(--border)';
      summary.appendChild(star);
    }
    var counts = [0, 0, 0, 0, 0];
    reviews.forEach(function (r) { counts[r.stars - 1]++; });
    var barsEl = document.getElementById('rating-bars');
    barsEl.innerHTML = [5, 4, 3, 2, 1].map(function (s) {
      var n = counts[s - 1];
      var pct = reviews.length ? (n / reviews.length) * 100 : 0;
      return (
        '<div class="rating-bar-row">' +
        '<span>' + s + ' \u2605</span>' +
        '<div class="bar-wrap"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="bar-count">' + n + '</span>' +
        '</div>'
      );
    }).join('');
    var listEl = document.getElementById('reviews-list');
    listEl.innerHTML = reviews.map(function (r) {
      return (
        '<div class="review-card">' +
        '<div class="review-card-header">' +
        '<span class="review-card-name">' + escapeHtml(r.name) + '</span>' +
        '<span class="review-card-date">' + escapeHtml(r.date) + '</span>' +
        '</div>' +
        '<div class="review-card-stars">' + '\u2605'.repeat(r.stars) + '</div>' +
        '<p class="review-card-text">' + escapeHtml(r.text) + '</p>' +
        '</div>'
      );
    }).join('');
  }

  var starInput = document.getElementById('star-input');
  var selectedStars = 0;
  starInput.querySelectorAll('.star-btn').forEach(function (btn, i) {
    var value = i + 1;
    btn.addEventListener('click', function () {
      selectedStars = value;
      starInput.querySelectorAll('.star-btn').forEach(function (b, j) {
        b.classList.toggle('active', j < value);
      });
    });
  });

  document.getElementById('submit-review').addEventListener('click', function () {
    var text = (document.getElementById('review-text').value || '').trim();
    if (selectedStars === 0) {
      alert('Choisissez une note de 1 à 5 étoiles.');
      return;
    }
    reviews.unshift({
      name: 'Vous',
      date: "Aujourd'hui",
      stars: selectedStars,
      text: text || 'Avis sans commentaire.'
    });
    document.getElementById('review-text').value = '';
    selectedStars = 0;
    starInput.querySelectorAll('.star-btn').forEach(function (b) { b.classList.remove('active'); });
    renderReviews();
  });

  updateProductCount();
  updateCartBadge();
  renderReviews();

  var loadingScreen = document.getElementById('loading-screen');
  var loadingBar = document.getElementById('loading-progress-bar');
  var loadingProgressWrap = document.querySelector('.loading-progress');
  if (loadingScreen) {
    // Failsafe: si l'événement load ne se déclenche pas, on ne bloque pas le site.
    setTimeout(function () {
      loadingScreen.classList.add('hidden');
    }, 3500);

    window.addEventListener('load', function () {
      var durationMs = 2000;
      var start = performance.now();

      function tick(now) {
        var t = Math.min(1, (now - start) / durationMs);
        var pct = Math.round(t * 100);
        if (loadingBar) loadingBar.style.width = pct + '%';
        if (loadingProgressWrap) loadingProgressWrap.setAttribute('aria-valuenow', String(pct));
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          loadingScreen.classList.add('hidden');
        }
      }

      requestAnimationFrame(tick);
    });
  }
})();
