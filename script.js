
document.addEventListener('DOMContentLoaded', () => {
    // Constantes e dados iniciais
    const ADMIN_PASSWORD = 'Ja997640401';
    const PIX_KEY = '18912553712';
    const AVAILABLE_TIMES = [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
        '20:00'
    ];

    // Variáveis de estado
    let currentUser = null;
    let currentBarbershopId = null;
    let selectedTime = null;
    let selectedServices = [];

    // Funções de utilidade e armazenamento local
    const showPage = (pageId) => {
        document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
        document.getElementById(pageId).classList.remove('hidden');
    };

    const generateUniqueId = () => Math.random().toString(36).substr(2, 9);
    
    const getLocalStorage = (key, defaultValue = []) => {
        try {
            return JSON.parse(localStorage.getItem(key)) || defaultValue;
        } catch {
            return defaultValue;
        }
    };
    
    const setLocalStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    let barbershops = getLocalStorage('barbershops');
    let clients = getLocalStorage('clients');
    let barbers = getLocalStorage('barbers');
    let appointments = getLocalStorage('appointments');

    // Funções de Renderização
    const renderBarbershops = () => {
        const list = document.getElementById('barbershop-list');
        list.innerHTML = '<h2>Barbearias e Barbeiros</h2>';
        
        const boosted = barbershops.filter(b => b.isBoosted);
        const regular = barbershops.filter(b => !b.isBoosted);
        const sortedBarbershops = [...boosted, ...regular];

        if (sortedBarbershops.length === 0) {
            list.innerHTML += '<p>Nenhuma barbearia cadastrada ainda.</p>';
            return;
        }

        sortedBarbershops.forEach(barbershop => {
            const card = document.createElement('div');
            card.className = `barbershop-card ${barbershop.isBoosted ? 'boosted' : ''}`;
            card.innerHTML = `
                <div>
                    <h3>${barbershop.name}</h3>
                    <p>${barbershop.isBoosted ? 'Perfil Turbinado!' : ''}</p>
                </div>
                <button class="select-barbershop-btn" data-id="${barbershop.id}">Agendar</button>
            `;
            list.appendChild(card);
        });
    };

    const renderServicesAndCombos = (barbershopId) => {
        const barbershop = barbershops.find(b => b.id === barbershopId);
        const servicesList = document.getElementById('services-list');
        servicesList.innerHTML = '<h2>Serviços e Combos</h2>';
        selectedServices = [];

        const renderItems = (items, type) => {
            if (items && items.length > 0) {
                items.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'service-item';
                    itemDiv.innerHTML = `
                        <div class="service-item-content">
                            <p>${item.name} - R$ ${item.price.toFixed(2)}</p>
                        </div>
                        <button class="add-service-btn" data-id="${item.id}" data-type="${type}">Adicionar</button>
                    `;
                    itemDiv.querySelector('.add-service-btn').onclick = (e) => {
                        const btn = e.target;
                        const id = btn.dataset.id;
                        const index = selectedServices.findIndex(s => s.id === id);
                        if (index === -1) {
                            selectedServices.push({ id, type, name: item.name, price: item.price });
                            btn.textContent = 'Remover';
                            btn.classList.add('selected');
                        } else {
                            selectedServices.splice(index, 1);
                            btn.textContent = 'Adicionar';
                            btn.classList.remove('selected');
                        }
                    };
                    servicesList.appendChild(itemDiv);
                });
            }
        };

        renderItems(barbershop.services, 'service');
        renderItems(barbershop.combos, 'combo');
    };

    const renderAvailableTimes = (barbershopId) => {
        const barbershop = barbershops.find(b => b.id === barbershopId);
        const scheduleTimesDiv = document.getElementById('schedule-times');
        scheduleTimesDiv.innerHTML = '';
        selectedTime = null;
        document.getElementById('confirm-appointment-btn').disabled = true;

        if (!barbershop || barbershop.availableTimes.length === 0) {
            scheduleTimesDiv.innerHTML = '<p>Nenhum horário disponível para agendamento.</p>';
            return;
        }

        barbershop.availableTimes.forEach(time => {
            const timeButton = document.createElement('button');
            timeButton.className = 'time-bubble';
            timeButton.textContent = time;
            timeButton.onclick = () => {
                document.querySelectorAll('.time-bubble').forEach(btn => btn.classList.remove('selected'));
                timeButton.classList.add('selected');
                selectedTime = time;
                document.getElementById('confirm-appointment-btn').disabled = false;
            };
            scheduleTimesDiv.appendChild(timeButton);
        });
    };

    const renderAdminDashboard = () => {
        const pendingList = document.getElementById('pending-appointments');
        pendingList.innerHTML = '';
        const pendingAppointments = appointments.filter(a => a.status === 'pending');
        
        if (pendingAppointments.length === 0) {
            pendingList.innerHTML = '<p>Nenhum agendamento pendente.</p>';
        } else {
            pendingAppointments.forEach(app => {
                const barbershop = barbershops.find(b => b.id === app.barbershopId);
                const client = clients.find(c => c.username === app.clientUsername);
                const appDiv = document.createElement('div');
                appDiv.className = 'admin-appointment-card';
                appDiv.innerHTML = `
                    <div>
                        <h3>Agendamento para ${app.time}</h3>
                        <p>Cliente: ${client.username} (${client.phone})</p>
                        <p>Barbearia: ${barbershop.name}</p>
                        <p>Serviços: ${app.services.map(s => s.name).join(', ')}</p>
                    </div>
                    <div class="action-buttons">
                        <button class="approve-btn" data-id="${app.id}">Aprovar</button>
                        <button class="reject-btn" data-id="${app.id}">Reprovar</button>
                    </div>
                `;
                pendingList.appendChild(appDiv);
            });
        }

        const manageList = document.getElementById('manage-barbershops');
        manageList.innerHTML = '<h2>Gerenciar Barbearias</h2>';
        if (barbershops.length === 0) {
            manageList.innerHTML += '<p>Nenhuma barbearia para gerenciar.</p>';
        } else {
            barbershops.forEach(barbershop => {
                const shopDiv = document.createElement('div');
                shopDiv.className = 'admin-barbershop-card';
                shopDiv.innerHTML = `
                    <p>${barbershop.name} ${barbershop.isBoosted ? '(Turbinado)' : ''}</p>
                    <button class="toggle-boost-btn" data-id="${barbershop.id}">
                        ${barbershop.isBoosted ? 'Remover Destaque' : 'Destacar'}
                    </button>
                `;
                manageList.appendChild(shopDiv);
            });
        }
    };

    const renderBarberDashboard = () => {
        const myBarbershop = barbershops.find(b => b.barberId === currentUser.id);
        if (myBarbershop) {
            document.getElementById('barbershop-name-input').value = myBarbershop.name;
            
            const servicesList = document.getElementById('barber-services-list');
            servicesList.innerHTML = myBarbershop.services.map(s => `
                <div class="service-item">
                    <p>${s.name} - R$ ${s.price.toFixed(2)}</p> 
                    <button class="remove-btn" data-type="service" data-id="${s.id}">Remover</button>
                </div>
            `).join('');
            
            const combosList = document.getElementById('barber-combos-list');
            combosList.innerHTML = myBarbershop.combos.map(c => `
                <div class="service-item">
                    <p>${c.name} - R$ ${c.price.toFixed(2)}</p>
                    <button class="remove-btn" data-type="combo" data-id="${c.id}">Remover</button>
                </div>
            `).join('');

            const scheduleDiv = document.getElementById('barber-schedule-selection');
            scheduleDiv.innerHTML = '';
            AVAILABLE_TIMES.forEach(time => {
                const timeButton = document.createElement('button');
                timeButton.className = 'time-bubble';
                timeButton.textContent = time;
                if (myBarbershop.availableTimes.includes(time)) {
                    timeButton.classList.add('selected');
                }
                timeButton.onclick = () => {
                    const index = myBarbershop.availableTimes.indexOf(time);
                    if (index === -1) {
                        myBarbershop.availableTimes.push(time);
                        timeButton.classList.add('selected');
                    } else {
                        myBarbershop.availableTimes.splice(index, 1);
                        timeButton.classList.remove('selected');
                    }
                    setLocalStorage('barbershops', barbershops);
                    renderBarbershops();
                };
                scheduleDiv.appendChild(timeButton);
            });

            const approvedAppointments = appointments.filter(a => a.barberId === currentUser.id && a.status === 'approved');
            const approvedAppointmentsDiv = document.getElementById('approved-barber-appointments');
            approvedAppointmentsDiv.innerHTML = '';
            if (approvedAppointments.length === 0) {
                approvedAppointmentsDiv.innerHTML += '<p>Nenhum agendamento aprovado.</p>';
            } else {
                approvedAppointments.forEach(app => {
                    const client = clients.find(c => c.username === app.clientUsername);
                    const appDiv = document.createElement('div');
                    appDiv.className = 'barber-appointment-card';
                    appDiv.innerHTML = `
                        <div>
                            <p><b>Horário:</b> ${app.time}</p>
                            <p><b>Cliente:</b> ${client.username} (${client.phone})</p>
                            <p><b>Serviços:</b> ${app.services.map(s => s.name).join(', ')}</p>
                        </div>
                    `;
                    approvedAppointmentsDiv.appendChild(appDiv);
                });
            }
        }
    };

    // Funções de fluxo
    const finalizeAppointment = () => {
        const barbershop = barbershops.find(b => b.id === currentBarbershopId);
        const barber = barbers.find(b => b.id === barbershop.barberId);
        
        const newAppointment = {
            id: generateUniqueId(),
            barbershopId: barbershop.id,
            barberId: barber.id,
            clientUsername: currentUser.username,
            time: selectedTime,
            services: selectedServices,
            status: 'pending'
        };
        appointments.push(newAppointment);
        setLocalStorage('appointments', appointments);

        barbershop.availableTimes = barbershop.availableTimes.filter(time => time !== selectedTime);
        setLocalStorage('barbershops', barbershops);
        
        showPage('confirmation-view');
    };

    // Event Listeners
    document.getElementById('barbershop-list').addEventListener('click', (e) => {
        if (e.target.classList.contains('select-barbershop-btn')) {
            currentBarbershopId = e.target.dataset.id;
            const barbershop = barbershops.find(b => b.id === currentBarbershopId);
            document.getElementById('barbershop-name-details').textContent = barbershop.name;
            renderServicesAndCombos(currentBarbershopId);
            renderAvailableTimes(currentBarbershopId);
            showPage('barbershop-details-view');
        }
    });

    document.getElementById('confirm-appointment-btn').addEventListener('click', () => {
        if (!currentUser) {
            document.getElementById('auth-title').textContent = 'Agendar Horário';
            showPage('auth-view');
        } else {
            finalizeAppointment();
        }
    });

    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const client = clients.find(c => c.username === username && c.password === password);
        if (client) {
            currentUser = client;
            alert('Login bem-sucedido!');
            finalizeAppointment();
        } else {
            alert('Usuário ou senha incorretos.');
        }
    });

    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const phone = document.getElementById('register-phone').value;
        if (clients.some(c => c.username === username)) {
            alert('Nome de usuário já existe.');
        } else {
            const newClient = { username, password, phone };
            clients.push(newClient);
            setLocalStorage('clients', clients);
            currentUser = newClient;
            alert('Cadastro concluído! Você será logado automaticamente.');
            finalizeAppointment();
        }
    });

    document.getElementById('copy-pix-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(PIX_KEY).then(() => {
            alert('Chave Pix copiada!');
        });
    });

    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            location.reload();
        });
    });

    document.getElementById('admin-login-btn').addEventListener('click', () => {
        showPage('admin-view');
    });

    document.getElementById('admin-login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('admin-password').value;
        if (password === ADMIN_PASSWORD) {
            document.getElementById('admin-login-section').classList.add('hidden');
            document.getElementById('admin-dashboard').classList.remove('hidden');
            renderAdminDashboard();
        } else {
            alert('Senha incorreta.');
        }
    });

    document.getElementById('admin-dashboard').addEventListener('click', (e) => {
        if (e.target.classList.contains('approve-btn')) {
            const id = e.target.dataset.id;
            const appointment = appointments.find(a => a.id === id);
            if (appointment) {
                appointment.status = 'approved';
                setLocalStorage('appointments', appointments);
                renderAdminDashboard();
                alert('Agendamento aprovado!');
            }
        }
        if (e.target.classList.contains('reject-btn')) {
            const id = e.target.dataset.id;
            const appointment = appointments.find(a => a.id === id);
            if (appointment) {
                appointment.status = 'rejected';
                setLocalStorage('appointments', appointments);
                renderAdminDashboard();
                alert('Agendamento reprovado!');
            }
        }
        if (e.target.classList.contains('toggle-boost-btn')) {
            const id = e.target.dataset.id;
            const barbershop = barbershops.find(b => b.id === id);
            if (barbershop) {
                barbershop.isBoosted = !barbershop.isBoosted;
                setLocalStorage('barbershops', barbershops);
                renderBarbershops();
                renderAdminDashboard();
                alert(`Status de destaque alterado para ${barbershop.isBoosted ? 'ON' : 'OFF'}.`);
            }
        }
    });

    document.getElementById('barber-login-btn').addEventListener('click', () => {
        showPage('barber-view');
    });

    document.getElementById('barber-login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('barber-login-username').value;
        const password = document.getElementById('barber-login-password').value;
        const barber = barbers.find(b => b.username === username && b.password === password);
        if (barber) {
            currentUser = barber;
            alert('Login de barbeiro bem-sucedido!');
            document.getElementById('barber-login-section').classList.add('hidden');
            document.getElementById('barber-dashboard').classList.remove('hidden');
            renderBarberDashboard();
        } else {
            alert('Usuário ou senha incorretos.');
        }
    });

    document.getElementById('barber-register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('barber-register-username').value;
        const password = document.getElementById('barber-register-password').value;
        const phone = document.getElementById('barber-register-phone').value;
        const barbershopName = document.getElementById('barbershop-name').value;
        
        if (barbers.some(b => b.username === username)) {
            alert('Nome de usuário já existe.');
        } else {
            const newBarber = { id: generateUniqueId(), username, password, phone, barbershopName };
            barbers.push(newBarber);
            const newBarbershop = {
                id: newBarber.id,
                barberId: newBarber.id,
                name: barbershopName,
                services: [],
                combos: [],
                availableTimes: [],
                isBoosted: false
            };
            barbershops.push(newBarbershop);
            setLocalStorage('barbers', barbers);
            setLocalStorage('barbershops', barbershops);
            
            currentUser = newBarber;
            alert('Cadastro de barbeiro concluído!');
            document.getElementById('barber-login-section').classList.add('hidden');
            document.getElementById('barber-dashboard').classList.remove('hidden');
            renderBarberDashboard();
        }
    });

    document.getElementById('barbershop-setup-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const myBarbershop = barbershops.find(b => b.barberId === currentUser.id);
        if (myBarbershop) {
            myBarbershop.name = document.getElementById('barbershop-name-input').value;
            setLocalStorage('barbershops', barbershops);
            renderBarbershops();
            alert('Nome da barbearia salvo!');
        }
    });
    
    document.getElementById('add-service-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const myBarbershop = barbershops.find(b => b.barberId === currentUser.id);
        if (myBarbershop) {
            const name = document.getElementById('service-name').value;
            const price = parseFloat(document.getElementById('service-price').value);
            myBarbershop.services.push({ id: generateUniqueId(), name, price });
            setLocalStorage('barbershops', barbershops);
            renderBarberDashboard();
            renderBarbershops();
            document.getElementById('add-service-form').reset();
        }
    });

    document.getElementById('add-combo-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const myBarbershop = barbershops.find(b => b.barberId === currentUser.id);
        if (myBarbershop) {
            const name = document.getElementById('combo-name').value;
            const price = parseFloat(document.getElementById('combo-price').value);
            myBarbershop.combos.push({ id: generateUniqueId(), name, price });
            setLocalStorage('barbershops', barbershops);
            renderBarberDashboard();
            renderBarbershops();
            document.getElementById('add-combo-form').reset();
        }
    });

    document.getElementById('barber-dashboard').addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const myBarbershop = barbershops.find(b => b.barberId === currentUser.id);
            const type = e.target.dataset.type;
            const id = e.target.dataset.id;
            
            if (type === 'service') {
                myBarbershop.services = myBarbershop.services.filter(s => s.id !== id);
            } else if (type === 'combo') {
                myBarbershop.combos = myBarbershop.combos.filter(c => c.id !== id);
            }
            setLocalStorage('barbershops', barbershops);
            renderBarberDashboard();
            renderBarbershops();
        }
    });

    document.getElementById('boost-profile-btn').addEventListener('click', () => {
        const myBarbershop = barbershops.find(b => b.barberId === currentUser.id);
        if (myBarbershop) {
            myBarbershop.isBoosted = true;
            setLocalStorage('barbershops', barbershops);
            renderBarberDashboard();
            renderBarbershops();
            alert('Perfil turbinado por 1 dia! Ele agora aparece no topo.');
        }
    });

    // Início do app
    renderBarbershops();
    showPage('client-view');
});
    