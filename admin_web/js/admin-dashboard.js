
let bookingChart = null; // instance Chart.js

// ---- Padanan _statusColor() ----
function statusClass(status) {
  if (status === 'approved') return 'status-approved';
  if (status === 'rejected') return 'status-rejected';
  return 'status-pending';
}

// ---- Padanan _loadDashboard() ----
async function loadDashboard() {
  setLoading(true);

  try {
    const [{ data: usersData, error: usersErr }, { data: roomsData, error: roomsErr }, { data: bookingsData, error: bookingsErr }] =
      await Promise.all([
        supabaseClient.from('profiles').select('id'),
        supabaseClient.from('spaces').select('id'),
        supabaseClient.from('bookings').select('*'),
      ]);

    if (usersErr) throw usersErr;
    if (roomsErr) throw roomsErr;
    if (bookingsErr) throw bookingsErr;

    const bookings = bookingsData ?? [];

    let revenue = 0;
    const monthCount = {}; // { 1: count, 2: count, ... }
    const currentYear = new Date().getFullYear();

    for (const b of bookings) {
      if (b.status === 'approved') {
        revenue += Number(b.price ?? 0);
      }
      const dateStr = b.booking_date;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d) && d.getFullYear() === currentYear) {
          const month = d.getMonth() + 1;
          monthCount[month] = (monthCount[month] ?? 0) + 1;
        }
      }
    }

    // Sort ikut created_at descending — padanan bookings.sort(...)
    bookings.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

    renderStats({
      userCount: (usersData ?? []).length,
      roomCount: (roomsData ?? []).length,
      bookingCount: bookings.length,
      revenue,
    });

    renderChart(monthCount);
    renderRecentBookings(bookings.slice(0, 6));
  } catch (err) {
    alert('Ralat ambil data dashboard: ' + err.message);
    console.error(err);
  } finally {
    setLoading(false);
  }
}

// ---- Padanan setState(_isLoading) ----
function setLoading(isLoading) {
  document.getElementById('loading-state').style.display = isLoading ? 'flex' : 'none';
  document.getElementById('dashboard-body').style.display = isLoading ? 'none' : 'block';

  const refreshBtn = document.getElementById('refresh-btn');
  refreshBtn.classList.toggle('spinning', isLoading);
}

// ---- Padanan _statCard() x4 ----
function renderStats({ userCount, roomCount, bookingCount, revenue }) {
  document.getElementById('stat-users').textContent = userCount;
  document.getElementById('stat-booking').textContent = bookingCount;
  document.getElementById('stat-rooms').textContent = roomCount;
  document.getElementById('stat-revenue').textContent = `RM ${revenue.toFixed(0)}`;
}

// ---- Padanan _buildChart() (fl_chart -> Chart.js) ----
function renderChart(monthCount) {
  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const dataPoints = months.map((_, i) => monthCount[i + 1] ?? 0);

  const ctx = document.getElementById('booking-chart').getContext('2d');

  if (bookingChart) {
    bookingChart.data.datasets[0].data = dataPoints;
    bookingChart.update();
    return;
  }

  bookingChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        data: dataPoints,
        backgroundColor: '#0a2540',
        borderRadius: 4,
        barThickness: 12,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { display: false, beginAtZero: true },
        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      },
    },
  });
}

// ---- Padanan senarai _recentBookings.map(...) ----
function renderRecentBookings(bookings) {
  const container = document.getElementById('recent-bookings-list');

  if (bookings.length === 0) {
    container.innerHTML = `<div class="booking-empty">Tiada tempahan lagi.</div>`;
    return;
  }

  container.innerHTML = bookings.map((b) => {
    const status = b.status ?? 'pending';
    return `
      <div class="booking-card">
        <div class="booking-card__info">
          <p class="booking-card__title">${escapeHtml(b.space_name ?? '')}</p>
          <p class="booking-card__subtitle">${escapeHtml(b.contact_email ?? '-')}
${escapeHtml(b.booking_date ?? '')} • ${escapeHtml(b.session ?? '')}</p>
        </div>
        <span class="booking-card__status ${statusClass(status)}">${status.toUpperCase()}</span>
      </div>
    `;
  }).join('');
}

// Elak XSS bila render data dari database terus ke innerHTML
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- Padanan Navigator/refresh button ----
document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  document.getElementById('refresh-btn').addEventListener('click', loadDashboard);

  // Padanan AdminBottomNav(currentIndex: 0)
  syncAdminBottomNavBadge('bottom-nav-container', 0);

  // Padanan AdminDrawer
  syncAdminDrawerBadge('drawer-container');
  document.getElementById('drawer-menu-btn').addEventListener('click', openDrawer);

  // Padanan initState(): listenForNewBookings(context, _loadDashboard) + PendingBookingNotifier.start()
  listenForNewBookings(loadDashboard);
});

// Padanan dispose(): stopListeningForNewBookings()
window.addEventListener('beforeunload', () => {
  stopListeningForNewBookings();
});