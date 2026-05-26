/* ============================================================
   TOUR DE FRANCIA - SCRIPT PRINCIPAL
   ============================================================ */

let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let total = 0;
let currentFilter = 'todos';
let currentSearch = '';

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    actualizarCarritoUI();
    aplicarFiltros();
    initMobileMenu();
    initCarousel();
    initSmoothScroll();
    if (document.getElementById('eco-contador')) {
        iniciarEcoContador();
    }
});

// --- CARRITO DE COMPRAS ---

function recalcularTotal() {
    total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    actualizarBadgeCarrito();
}

function agregarAlCarrito(nombre, precio) {
    const productoExistente = carrito.find(item => item.nombre === nombre);
    if (productoExistente) {
        productoExistente.cantidad += 1;
    } else {
        carrito.push({ nombre: nombre, precio: precio, cantidad: 1 });
    }
    guardarCarrito();
    actualizarCarritoUI();
    mostrarToast(`¡${nombre} añadido! 🚴`);
    
    const carritoBox = document.getElementById('carrito-flotante');
    if (carritoBox && !carritoBox.classList.contains('visible')) {
        carritoBox.classList.add('visible');
    }
}

function actualizarCarritoUI() {
    const lista = document.getElementById('lista-carrito');
    const precioTotal = document.getElementById('total-precio');
    if (!lista || !precioTotal) return;

    lista.innerHTML = '';
    if (carrito.length === 0) {
        lista.innerHTML = '<li class="empty-msg" style="padding:20px; text-align:center; color:var(--text-muted);">Tu cesta está vacía</li>';
    } else {
        carrito.forEach((producto, index) => {
            const li = document.createElement('li');
            li.style.cssText = 'display:flex; flex-direction:column; padding:14px 20px; border-bottom:1px solid var(--border-subtle);';
            li.innerHTML = `
                <div style="display:flex; justify-content:space-between; width:100%; align-items:center; margin-bottom:8px;">
                    <span style="font-weight:600; color:#fff;">${producto.nombre}</span>
                    <strong style="color:var(--accent);">${(producto.precio * producto.cantidad).toLocaleString('es-ES')}€</strong>
                </div>
                <div style="display:flex; align-items:center; gap:10px; justify-content:flex-end; width:100%;">
                    <button onclick="cambiarCantidad(${index}, -1)" style="width:28px; height:28px; cursor:pointer; border:1px solid var(--border-medium); background:var(--bg-card); color:#fff; border-radius:6px;">-</button>
                    <span style="font-size:0.85rem; color:var(--text-secondary); min-width:30px; text-align:center;">${producto.cantidad}</span>
                    <button onclick="cambiarCantidad(${index}, 1)" style="width:28px; height:28px; cursor:pointer; border:1px solid var(--border-medium); background:var(--bg-card); color:#fff; border-radius:6px;">+</button>
                    <button onclick="eliminarDelCarrito(${index})" style="background:#e53e3e; color:white; border:none; width:26px; height:26px; border-radius:50%; cursor:pointer; margin-left:8px; display:flex; align-items:center; justify-content:center; font-size:0.8rem;">✕</button>
                </div>
            `;
            lista.appendChild(li);
        });
    }
    recalcularTotal();
    if (precioTotal) precioTotal.innerText = total.toLocaleString('es-ES');
}

function cambiarCantidad(index, delta) {
    carrito[index].cantidad += delta;
    if (carrito[index].cantidad <= 0) {
        eliminarDelCarrito(index);
    } else {
        guardarCarrito();
        actualizarCarritoUI();
    }
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    guardarCarrito();
    actualizarCarritoUI();
}

function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

function actualizarBadgeCarrito() {
    const badge = document.getElementById('cartCountBadge');
    if (badge) {
        const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function pagar() {
    if (carrito.length === 0) {
        mostrarToast("Añade productos primero 😔");
    } else {
        mostrarToast(`Procesando pago de ${total.toLocaleString('es-ES')}€...`);
        setTimeout(() => {
            carrito = [];
            guardarCarrito();
            actualizarCarritoUI();
            const carritoBox = document.getElementById('carrito-flotante');
            if (carritoBox && carritoBox.classList.contains('visible')) {
                toggleCarrito();
            }
            alert("✅ ¡Gracias por tu compra! Pedido enviado correctamente.");
        }, 1500);
    }
}

function toggleCarrito() {
    const carritoBox = document.getElementById('carrito-flotante');
    if (carritoBox) {
        carritoBox.classList.toggle('visible');
    }
}

// --- TOAST NOTIFICACIÓN ---
function mostrarToast(mensaje) {
    const toast = document.getElementById("toast");
    if (toast) {
        toast.innerText = mensaje;
        toast.className = "show";
        setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
    }
}

// --- MENÚ MÓVIL ---
function initMobileMenu() {
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    const nav = document.getElementById('mainNav');
    if (toggleBtn && nav) {
        toggleBtn.addEventListener('click', () => {
            nav.classList.toggle('open');
            const spans = toggleBtn.querySelectorAll('span');
            if (nav.classList.contains('open')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = '';
                spans[1].style.opacity = '';
                spans[2].style.transform = '';
            }
        });
        // Cerrar menú al hacer clic en un enlace
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('open');
                const spans = toggleBtn.querySelectorAll('span');
                spans[0].style.transform = '';
                spans[1].style.opacity = '';
                spans[2].style.transform = '';
            });
        });
    }
}

function toggleMobileMenu() {
    const nav = document.getElementById('mainNav');
    if (nav) nav.classList.toggle('open');
}

// --- TIENDA: FILTROS Y BÚSQUEDA ---
function filtrarProductos(categoria) {
    currentFilter = categoria;
    // Actualizar botones activos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.trim().toLowerCase().includes(categoria) || 
            (categoria === 'todos' && btn.textContent.trim() === 'Todos')) {
            btn.classList.add('active');
        }
    });
    aplicarFiltros();
}

function buscarProductos() {
    const input = document.getElementById('search-input');
    currentSearch = input ? input.value.toLowerCase().trim() : '';
    aplicarFiltros();
}

function aplicarFiltros() {
    const productos = document.querySelectorAll('.product-card');
    let visibleCount = 0;
    productos.forEach(prod => {
        const catProducto = prod.getAttribute('data-cat');
        const nombre = prod.querySelector('h3') ? prod.querySelector('h3').innerText.toLowerCase() : '';
        const matchesCategory = (currentFilter === 'todos' || catProducto === currentFilter);
        const matchesSearch = !currentSearch || nombre.includes(currentSearch) || 
                              (prod.querySelector('p') && prod.querySelector('p').innerText.toLowerCase().includes(currentSearch));
        
        if (matchesCategory && matchesSearch) {
            prod.style.display = 'flex';
            visibleCount++;
        } else {
            prod.style.display = 'none';
        }
    });
    
    // Mostrar mensaje si no hay resultados
    const grid = document.querySelector('.shop-grid');
    if (grid) {
        const existingMsg = grid.querySelector('.no-results-msg');
        if (visibleCount === 0 && !existingMsg) {
            const msg = document.createElement('div');
            msg.className = 'no-results-msg';
            msg.style.cssText = 'grid-column:1/-1; text-align:center; padding:60px 20px; color:var(--text-muted);';
            msg.innerHTML = '<i class="fas fa-search" style="font-size:3rem; margin-bottom:16px; display:block; opacity:0.5;"></i><p style="font-size:1.2rem;">No se encontraron productos</p><p style="font-size:0.9rem;">Intenta con otros filtros o términos de búsqueda</p>';
            grid.appendChild(msg);
        } else if (visibleCount > 0 && existingMsg) {
            existingMsg.remove();
        }
    }
}

// --- CARRUSEL DE LÍNEA DE TIEMPO ---
let currentSlide = 0;
let totalSlides = 0;

function initCarousel() {
    const track = document.getElementById('carouselTrack');
    const dotsContainer = document.getElementById('carouselDots');
    if (!track || !dotsContainer) return;

    const slides = track.querySelectorAll('.carousel-slide');
    totalSlides = slides.length;
    if (totalSlides === 0) return;

    // Crear dots
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Ir a diapositiva ${i + 1}`);
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    }

    updateCarousel();
    
    // Soporte para gestos táctiles
    let touchStartX = 0;
    let touchEndX = 0;
    track.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, {passive: true});
    track.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            moveCarousel(diff > 0 ? 1 : -1);
        }
    });
}

function moveCarousel(direction) {
    currentSlide += direction;
    if (currentSlide < 0) currentSlide = totalSlides - 1;
    if (currentSlide >= totalSlides) currentSlide = 0;
    updateCarousel();
}

function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
}

function updateCarousel() {
    const track = document.getElementById('carouselTrack');
    const dots = document.querySelectorAll('.carousel-dot');
    if (!track) return;

    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
}

// --- SMOOTH SCROLL PARA ENLACES INTERNOS ---
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// --- FORMULARIO DE FEEDBACK ---
function prepararFeedbackForm(form) {
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = document.getElementById('name')?.value || '';
        const email = document.getElementById('email')?.value || '';
        const mensaje = document.getElementById('message')?.value || '';
        
        const mailtoLink = `mailto:info@tourdefrancia.com?subject=Feedback de ${encodeURIComponent(nombre)}&body=${encodeURIComponent(mensaje)}%0D%0A%0D%0AEmail: ${encodeURIComponent(email)}`;
        
        mostrarToast('Abriendo tu cliente de correo... 📧');
        setTimeout(() => {
            window.location.href = mailtoLink;
        }, 800);
    });
}

// --- SOSTENIBILIDAD ---

function iniciarEcoContador() {
    let ahorroBase = 12450.75;
    const el = document.getElementById('eco-contador');
    if (!el) return;
    
    el.innerText = ahorroBase.toFixed(3).replace('.', ',') + " kg";
    
    setInterval(() => {
        ahorroBase += Math.random() * 0.05;
        el.innerText = ahorroBase.toFixed(3).replace('.', ',') + " kg";
    }, 2000);
}

function calcularImpactoPersonal() {
    const km = document.getElementById('km-input')?.value;
    const resultado = document.getElementById('resultado-personal');
    if (!resultado) return;

    if (km > 0) {
        const ahorro = (km * 0.25).toFixed(2).replace('.', ',');
        resultado.innerText = `¡Ahorrarías ${ahorro} kg de CO₂ a la semana! 🌿`;
        resultado.style.color = '#4CAF50';
    } else {
        resultado.innerText = "Por favor, introduce un número válido.";
        resultado.style.color = '#e53e3e';
    }
}

// --- CERRAR CARRITO AL HACER CLIC FUERA ---
document.addEventListener('click', (e) => {
    const carritoBox = document.getElementById('carrito-flotante');
    const cartToggle = document.querySelector('.cart-toggle-btn');
    if (carritoBox && carritoBox.classList.contains('visible')) {
        if (!carritoBox.contains(e.target) && !cartToggle.contains(e.target) && !e.target.closest('.btn-add-cart')) {
            carritoBox.classList.remove('visible');
        }
    }
});

// --- CERRAR CARRITO CON TECLA ESC ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const carritoBox = document.getElementById('carrito-flotante');
        if (carritoBox && carritoBox.classList.contains('visible')) {
            carritoBox.classList.remove('visible');
        }
    }
});