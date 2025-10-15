let data = [];
let filteredData = [];
let currentPage = 1;
let rowsPerPage = 10;
let highlightedRow = null;

// Variables globales
let game = null;
let board = null;
let pendingPromotion = null;
let moveIndex = 0;
let moveList = [];
let currentFen = null;
let autoPlayEnabled = false;
let isAutoPlaying = false;
let autoPlayFenTurn = null;
let appliedMoves = [];
let initialFen = null;

async function loadData() {
  try {
    const res = await fetch("../data/fens_mate_verificados.json?v=@VERSION");
    data = await res.json();
    filteredData = [...data];
    renderTable();
  } catch (e) {
    console.error("Error cargando JSON:", e);
    document.getElementById("pageInfo").textContent = "Error al cargar los datos.";
  }
}

function resetPuzzle() {
  if (!currentFen) return;
  game = new Chess(currentFen);
  moveIndex = 0;
  pendingPromotion = null;
  appliedMoves = [];
  if (board) board.position(currentFen);
  highlightKingInCheck(currentFen);
  showErrorMessage("❌ Incorrecto. Puzzle reiniciado.");
  updateProgress(0);

  if (autoPlayEnabled && autoPlayFenTurn) {
    setTimeout(() => {
      if (window.playAutoMovesOfColor) window.playAutoMovesOfColor();
    }, 400);
  }
}

function updateProgress(percent) {
  const progressBar = document.getElementById("progressBar");
  if (!progressBar) return;
  const isMobile = window.innerWidth < 768;
  if (isMobile) {
    progressBar.style.width = percent + "%";
    progressBar.style.height = "100%";
  } else {
    progressBar.style.height = percent + "%";
    progressBar.style.width = "100%";
  }
}

function showSuccessMessage(msg) {
  const alert = document.createElement("div");
  alert.className = "alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3";
  alert.style.zIndex = "3000";
  alert.textContent = msg;
  document.body.appendChild(alert);
  setTimeout(() => alert.remove(), 1500);
}

function showErrorMessage(msg) {
  const alert = document.createElement("div");
  alert.className = "alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-3";
  alert.style.zIndex = "3000";
  alert.textContent = msg;
  document.body.appendChild(alert);
  setTimeout(() => alert.remove(), 2000);
}

function applyFilters() {
  const winner = document.getElementById("winnerFilter").value;
  const mate = document.getElementById("mateFilter").value;

  filteredData = data.filter(row => {
    let ok = true;
    if (winner && row.Winner !== winner) ok = false;
    if (mate && parseInt(row.MateIn) !== parseInt(mate)) ok = false;
    return ok;
  });

  currentPage = 1;
  renderTable();
}

function resetFilters() {
  document.getElementById("winnerFilter").value = "";
  document.getElementById("mateFilter").value = "";
  filteredData = [...data];
  currentPage = 1;
  renderTable();
}

function renderTable() {
  const table = document.getElementById("fenTable");
  table.innerHTML = "";

  let start = (currentPage - 1) * rowsPerPage;
  let end = start + rowsPerPage;
  let pageData = filteredData.slice(start, end);

  pageData.forEach((row, index) => {
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${start + index + 1}</td>
      <td class="d-none d-md-table-cell">${row.FEN}</td>
      <td>${row.MateIn}</td>
      <td>${(row.Winner === 'Black' ? 'Negras' : 'Blancas')}</td>
      <td><button class="btn btn-sm btn-primary" onclick="showFen('${row.Winner}', '${row.FEN}', '${row.Moves.replace(/'/g, "\\'")}', '${row.MateIn}', this)">👁️</button></td>
    `;
    table.appendChild(tr);
  });

  const total = filteredData.length;
  const totalPages = Math.ceil(total / rowsPerPage);
  const pageInfo = document.getElementById("pageInfo");
  pageInfo.textContent = total
    ? `Mostrando ${start + 1}-${Math.min(end, total)} de ${total} resultados (página ${currentPage} de ${totalPages})`
    : "Sin resultados";
}

function highlightKingInCheck() {
  document.querySelectorAll('.square-55d63').forEach(sq => {
    sq.classList.remove('square-in-check');
  });

  if (game && game.in_check()) {
    const fenParts = game.fen().split(' ');
    const turn = fenParts[1];
    const boardObj = game.board();
    let kingSquare = null;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = boardObj[row][col];
        if (piece && piece.type === 'k' && piece.color === turn) {
          const file = String.fromCharCode('a'.charCodeAt(0) + col);
          const rank = (8 - row).toString();
          kingSquare = file + rank;
        }
      }
    }
    if (kingSquare) {
      const squareEl = document.querySelector(`.square-${kingSquare}`);
      if (squareEl) squareEl.classList.add('square-in-check');
    }
  }
}

function showFen(winnerColor, fen, moves, mateIn, btn) {
  if (highlightedRow) highlightedRow.classList.remove("table-active");
  highlightedRow = btn.closest("tr");
  highlightedRow.classList.add("table-active");

  game = new Chess(fen);
  currentFen = fen;
  initialFen = fen;
  moveList = moves.trim().split(/\s+/);
  moveIndex = 0;
  appliedMoves = [];

  const progressBar = document.getElementById("progressBar");
  if (progressBar) {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      progressBar.style.width = "0%";
      progressBar.style.height = "100%";
    } else {
      progressBar.style.height = "0%";
      progressBar.style.width = "100%";
    }
  }

  board = Chessboard('board', {
    position: fen,
    pieceTheme: 'img/chesspieces/wikipedia/{piece}.png',
    draggable: true,
    onDragStart: (source, piece) => {
      if (game.game_over() ||
          (game.turn() === 'w' && piece.startsWith('b')) ||
          (game.turn() === 'b' && piece.startsWith('w'))) {
        return false;
      }
    },
    onDrop: (source, target) => {
      const expected = moveList[moveIndex];
      const piece = game.get(source);
      let expectedPromotion = expected.length === 5 ? expected[4] : null;
      let promotionNeeded = false;

      if (piece && piece.type === 'p') {
        const rank = target[1];
        if ((piece.color === 'w' && rank === '8') || (piece.color === 'b' && rank === '1')) {
          promotionNeeded = true;
        }
      }

      if (promotionNeeded) {
        pendingPromotion = { source, target, expected, expectedPromotion, color: piece.color };
        const promoModalEl = document.getElementById("promotionModal");
        document.querySelectorAll('.promo-btn img').forEach(img => {
          const pieceType = img.parentElement.dataset.piece.toUpperCase();
          img.src = `img/chesspieces/wikipedia/${piece.color}${pieceType}.png`;
        });
        const promoModal = new bootstrap.Modal(promoModalEl);
        promoModal.show();
        return 'snapback';
      }

      const userMove = source + target + (expectedPromotion || "");
      if (userMove === expected) {
        const move = game.move({ from: source, to: target, promotion: expectedPromotion || 'q' });
        if (!move) return 'snapback';
        appliedMoves.push(expected);
        moveIndex++;
        highlightKingInCheck(game.fen());
        const percent = Math.round((moveIndex / moveList.length) * 100);
        updateProgress(percent);
        if (moveIndex >= moveList.length) {
          showSuccessMessage("🎉 ¡Puzzle completado!");
        } else {
          setTimeout(() => {
            if (window.playAutoMovesOfColor) window.playAutoMovesOfColor();
          }, 300);
        }
      } else {
        setTimeout(() => { resetPuzzle(); updateProgress(0); }, 300);
        return 'snapback';
      }
    },
    onSnapEnd: () => board.position(game.fen())
  });

  highlightKingInCheck(fen);

  // --- NUEVO: Autoplay ---
  const fenTurn = fen.split(" ")[1];
  autoPlayEnabled = true;
  autoPlayFenTurn = fenTurn;

  window.playAutoMovesOfColor = async function playAutoMovesOfColor() {
    if (isAutoPlaying) return;
    isAutoPlaying = true;

    async function step() {
      if (!board || !game || moveIndex >= moveList.length) {
        isAutoPlaying = false;
        return;
      }
      const turn = game.turn();
      if (turn !== autoPlayFenTurn) {
        isAutoPlaying = false;
        return;
      }
      const move = moveList[moveIndex];
      if (!move || move.length < 4) {
        isAutoPlaying = false;
        return;
      }
      const from = move.substring(0, 2);
      const to = move.substring(2, 4);
      const promo = move.length === 5 ? move[4] : undefined;
      const res = game.move({ from, to, promotion: promo });
      if (!res) { isAutoPlaying = false; return; }

      appliedMoves.push(move);
      moveIndex++;
      board.position(game.fen());
      highlightKingInCheck(game.fen());
      updateProgress(Math.round((moveIndex / moveList.length) * 100));
      await new Promise(r => setTimeout(r, 700));
      step();
    }

    step();
  };

  setTimeout(() => {
    if (window.playAutoMovesOfColor) window.playAutoMovesOfColor();
  }, 600);

  let sideToMove = fen.split(" ")[1] === "w" ? "Blancas" : "Negras";
  let textoGanan = (winnerColor === "Black" ? "Negras" : "Blancas");
  //document.getElementById("sideToMove").textContent = sideToMove;
  document.getElementById("mateIn").textContent = mateIn;
  document.getElementById("moves").textContent = moves;
  document.getElementById("gananId").textContent = textoGanan;
  document.getElementById("movesContainer").classList.add("d-none");

  if (sideToMove === textoGanan) {
    document.getElementById("gananId").textContent = (sideToMove === 'Negras' ? 'Blancas' : 'Negras');
  }

  let toggleBtn = document.getElementById("toggleMoves");
  toggleBtn.textContent = "👁️ Mostrar movimientos";
  toggleBtn.onclick = () => {
    let movesEl = document.getElementById("movesContainer");
    movesEl.classList.toggle("d-none");
    toggleBtn.textContent = movesEl.classList.contains("d-none")
      ? "👁️ Mostrar movimientos"
      : "🙈 Ocultar movimientos";
  };

  let modal = new bootstrap.Modal(document.getElementById("fenModal"));
  modal.show();
}

document.getElementById("prevPage").addEventListener("click", e => {
  e.preventDefault();
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
});

document.getElementById("nextPage").addEventListener("click", e => {
  e.preventDefault();
  if (currentPage * rowsPerPage < filteredData.length) {
    currentPage++;
    renderTable();
  }
});

document.getElementById("rowsPerPageSelect").addEventListener("change", e => {
  rowsPerPage = parseInt(e.target.value);
  currentPage = 1;
  renderTable();
});

document.querySelectorAll('.promo-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    const promo = e.currentTarget.dataset.piece;
    const modal = bootstrap.Modal.getInstance(document.getElementById("promotionModal"));
    modal.hide();

    if (!pendingPromotion) return;
    const { source, target, expected } = pendingPromotion;
    pendingPromotion = null;
    const userMove = source + target + promo;

    if (userMove === expected) {
      const move = game.move({ from: source, to: target, promotion: promo });
      if (!move) return;
      board.position(game.fen());
      highlightKingInCheck(game.fen());
      appliedMoves.push(userMove);
      moveIndex++;
      updateProgress(Math.round((moveIndex / moveList.length) * 100));
      if (moveIndex >= moveList.length) showSuccessMessage("🎉 ¡Puzzle completado!");
      else setTimeout(() => { if (window.playAutoMovesOfColor) window.playAutoMovesOfColor(); }, 300);
    } else {
      setTimeout(() => { resetPuzzle(); updateProgress(0); }, 300);
    }
  });
});

loadData();