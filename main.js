"use strict";

/* COSTANTI DI GIOCO */
const COLS = 12;
const ROWS = 10;
const CELL_SIZE = 40;                        // Ogni cella è 40x40 px
const CANVAS_WIDTH = COLS * CELL_SIZE;         // 480 px
const CANVAS_HEIGHT = 600;                     // L'area totale di gioco
const GRID_ROWS_VISIBLE = ROWS;               // La griglia in cui vengono posizionate le bolle
const SHOOTER_Y = CANVAS_HEIGHT - 50;          // Posizione verticale fissa del lanciatore
const SHOOTER_SPEED = 6;
const COLORS = ["", "red", "blue", "green", "yellow", "purple"];  // Indici 1-5

/* VARIABILI GLOBALI */
let canvas, ctx;
let grid;         // matrice [ROW][COL] contenente 0 (vuoto) oppure un indice colore (1-5)
let shooter;      // oggetto { x, y, vx, vy, color, radius }
let score = 0;
let gameRunning = false;
let playerName = "";
// Variabile per memorizzare la posizione del mouse (usata per disegnare la freccia)
let mousePos = { x: CANVAS_WIDTH / 2, y: SHOOTER_Y };

/* INIZIALIZZAZIONE DELLE COMPONENTI */
window.onload = function() {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");
  
  // Bind dei pulsanti
  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("recordBtn").addEventListener("click", showRecords);
  
  // Gestione del click: il click sul canvas definisce l'angolo di lancio
  canvas.addEventListener("click", function(e) {
    // Se la bolla non è già in movimento
    if (!gameRunning || (shooter.vx !== 0 || shooter.vy !== 0)) return;
    
    let rect = canvas.getBoundingClientRect();
    let clickX = e.clientX - rect.left;
    let clickY = e.clientY - rect.top;
    
    let dx = clickX - shooter.x;
    let dy = clickY - shooter.y;
    let angle = Math.atan2(dy, dx);
    
    // Forza il lancio verso l'alto se l'angolo risulta troppo basso
    if (dy > 0) angle = -Math.abs(angle);
    
    shooter.vx = SHOOTER_SPEED * Math.cos(angle);
    shooter.vy = SHOOTER_SPEED * Math.sin(angle);
  });
  
  // Nuovo event listener: aggiorna la posizione del mouse per mostrare la freccia di direzionamento
  canvas.addEventListener("mousemove", function(e) {
    if (!gameRunning) return;
    let rect = canvas.getBoundingClientRect();
    let mX = e.clientX - rect.left;
    let mY = e.clientY - rect.top;
    // Se il lanciatore è inattivo, aggiorna la posizione
    if (shooter && shooter.vx === 0 && shooter.vy === 0) {
      mousePos.x = mX;
      mousePos.y = mY;
    }
  });
};

/* FUNZIONI DI GIOCO */

// Inizializza la griglia: le prime 5 righe sono pre-popolate con bolle casuali
function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      if (r < 5) {
        grid[r][c] = Math.floor(Math.random() * 5) + 1;
      } else {
        grid[r][c] = 0;
      }
    }
  }
}

// Crea una nuova bolla da lanciare (colore casuale)
function shootNewBubble() {
  shooter = {
    x: CANVAS_WIDTH / 2,
    y: SHOOTER_Y,
    vx: 0,
    vy: 0,
    color: Math.floor(Math.random() * 5) + 1,
    radius: CELL_SIZE / 2 - 2
  };
  // Resetta anche la posizione del mouse per la freccia
  mousePos.x = shooter.x;
  mousePos.y = shooter.y;
}

// Aggiorna il gioco; aggiorna la bolla in volo e le collisioni
function updateGame() {
  if (!gameRunning) return;
  
  if (shooter.vx !== 0 || shooter.vy !== 0) {
    shooter.x += shooter.vx;
    shooter.y += shooter.vy;
    
    // Rimbalzo sui lati
    if (shooter.x - shooter.radius < 0) {
      shooter.x = shooter.radius;
      shooter.vx = -shooter.vx;
    }
    if (shooter.x + shooter.radius > CANVAS_WIDTH) {
      shooter.x = CANVAS_WIDTH - shooter.radius;
      shooter.vx = -shooter.vx;
    }
    
    // Se la bolla tocca il bordo superiore
    if (shooter.y - shooter.radius <= 0) {
      shooter.vx = shooter.vy = 0;
      attachShooter();
    }
    
    // Collisione con le bolle già presenti
    outer: for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] !== 0) {
          let bx = c * CELL_SIZE + CELL_SIZE / 2;
          let by = r * CELL_SIZE + CELL_SIZE / 2;
          let dx = shooter.x - bx;
          let dy = shooter.y - by;
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CELL_SIZE) {
            shooter.vx = shooter.vy = 0;
            attachShooter();
            break outer;
          }
        }
      }
    }
  }
  
  drawGame();
  requestAnimationFrame(updateGame);
}

// Disegna la griglia, il lanciatore e aggiunge i nuovi elementi grafici
function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Disegna la griglia delle bolle
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] !== 0) {
        let color = COLORS[grid[r][c]];
        let cx = c * CELL_SIZE + CELL_SIZE / 2;
        let cy = r * CELL_SIZE + CELL_SIZE / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "#222";
        ctx.stroke();
        ctx.closePath();
      }
    }
  }
  
  // Disegna la linea tratteggiata che indica il bordo inferiore della griglia
  ctx.beginPath();
  ctx.setLineDash([5, 5]);
  ctx.moveTo(0, ROWS * CELL_SIZE); // ad esempio, a 400px (se ROWS=10, CELL_SIZE=40)
  ctx.lineTo(CANVAS_WIDTH, ROWS * CELL_SIZE);
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]); // reset della dash
  ctx.closePath();
  
  // Disegna la bolla del lanciatore
  if (shooter) {
    ctx.beginPath();
    ctx.arc(shooter.x, shooter.y, shooter.radius, 0, Math.PI * 2);
    ctx.fillStyle = COLORS[shooter.color];
    ctx.fill();
    ctx.strokeStyle = "#222";
    ctx.stroke();
    ctx.closePath();
  }
  
  // Disegna lo score (nella parte bassa del canvas)
  ctx.fillStyle = "#000";
  ctx.font = "16px Arial";
  ctx.fillText("Score: " + score, 10, canvas.height - 10);
  
  // NOVITÀ: Disegna la freccia di direzionamento se il lanciatore è in attesa (idle)
  if (shooter && shooter.vx === 0 && shooter.vy === 0) {
    // Calcola l'angolo dal lanciatore alla posizione del mouse
    let dx = mousePos.x - shooter.x;
    let dy = mousePos.y - shooter.y;
    // Se il mouse è sotto il lanciatore, forziamo la freccia verso l'alto
    if (dy > 0) { dx = 0; dy = -1; }
    let angle = Math.atan2(dy, dx);
    let arrowLength = 60;
    let arrowX = shooter.x + arrowLength * Math.cos(angle);
    let arrowY = shooter.y + arrowLength * Math.sin(angle);
    
    // Disegna la linea tratteggiata per la freccia
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(shooter.x, shooter.y);
    ctx.lineTo(arrowX, arrowY);
    ctx.strokeStyle = "#f0f";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.closePath();
    
    // Disegna la testa della freccia
    drawArrowHead(shooter.x, shooter.y, arrowX, arrowY);
  }
}

// Funzione ausiliaria per disegnare la testa della freccia
function drawArrowHead(fromX, fromY, toX, toY) {
  let headLength = 10; // lunghezza della testa
  let angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI/6), toY - headLength * Math.sin(angle - Math.PI/6));
  ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI/6), toY - headLength * Math.sin(angle + Math.PI/6));
  ctx.lineTo(toX, toY);
  ctx.fillStyle = "#f0f";
  ctx.fill();
  ctx.closePath();
}

// Attacca la bolla lanciata alla griglia e gestisce le eliminazioni
function attachShooter() {
  let col = Math.floor(shooter.x / CELL_SIZE);
  let row = Math.floor(shooter.y / CELL_SIZE);
  row = Math.max(0, Math.min(ROWS - 1, row));
  col = Math.max(0, Math.min(COLS - 1, col));
  
  if (grid[row][col] === 0) {
    grid[row][col] = shooter.color;
  } else {
    let dirs = [
      { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
      { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
      { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
      { dr: 1, dc: -1 }, { dr: 1, dc: 1 }
    ];
    let placed = false;
    for (let d of dirs) {
      let nr = row + d.dr;
      let nc = col + d.dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] === 0) {
        grid[nr][nc] = shooter.color;
        placed = true;
        break;
      }
    }
    if (!placed) grid[row][col] = shooter.color;
  }
  
  removeGroups(row, col, shooter.color);
  shootNewBubble();
  if (checkGameOver()) {
    gameOver("Game Over! Il campo è pieno.");
  }
}

// Rimuove gruppi di bolle adiacenti; aggiorna lo score e gestisce le bolle fluttuanti
function removeGroups(row, col, color) {
  let visited = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
  let group = [];
  
  function dfs(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    if (visited[r][c]) return;
    if (grid[r][c] !== color) return;
    visited[r][c] = true;
    group.push({ r, c });
    dfs(r - 1, c);
    dfs(r + 1, c);
    dfs(r, c - 1);
    dfs(r, c + 1);
    dfs(r - 1, c - 1);
    dfs(r - 1, c + 1);
    dfs(r + 1, c - 1);
    dfs(r + 1, c + 1);
  }
  dfs(row, col);
  
  if (group.length >= 3) {
    group.forEach(cell => { grid[cell.r][cell.c] = 0; });
    score += group.length * 10;
    removeFloatingBubbles();
  }
}

// Rimuove le bolle che non sono più connesse al bordo superiore
function removeFloatingBubbles() {
  let connected = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
  
  function dfs(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    if (connected[r][c]) return;
    if (grid[r][c] === 0) return;
    connected[r][c] = true;
    dfs(r - 1, c);
    dfs(r + 1, c);
    dfs(r, c - 1);
    dfs(r, c + 1);
    dfs(r - 1, c - 1);
    dfs(r - 1, c + 1);
    dfs(r + 1, c - 1);
    dfs(r + 1, c + 1);
  }
  
  for (let c = 0; c < COLS; c++) {
    if (grid[0][c] !== 0) dfs(0, c);
  }
  
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] !== 0 && !connected[r][c]) {
        grid[r][c] = 0;
        score += 5;
      }
    }
  }
}

// Verifica se il campo è pieno (game over)
function checkGameOver() {
  for (let c = 0; c < COLS; c++) {
    if (grid[ROWS - 1][c] !== 0) return true;
  }
  return false;
}

// Fine partita: invia il record al server e mostra il messaggio finale
function gameOver(msg) {
  gameRunning = false;
  let recordEntry = {
    name: playerName,
    score: score,
    date: new Date().toLocaleString()
  };
  $.ajax({
    url: "record.php",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(recordEntry)
  })
  .done(function(response) {
    console.log("Record salvato:", response);
  })
  .fail(function(jqXHR, textStatus, errorThrown) {
    console.error("Errore nel salvataggio del record:", textStatus, errorThrown);
  });
  alert(msg + " - Score: " + score);
  resetGame();
}

// Avvia il gioco: recupera il nome, nasconde la schermata iniziale e inizializza la partita.
function startGame() {
  playerName = document.getElementById("playerName").value.trim();
  if (playerName === "") {
    alert("Inserisci il tuo nome per iniziare la partita.");
    return;
  }
  document.getElementById("homeScreen").style.display = "none";
  document.getElementById("gameInfo").style.display = "block";
  canvas.classList.remove("hidden");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  score = 0;
  initGrid();
  shootNewBubble();
  gameRunning = true;
  updateGame();
}

// Resetta il gioco e torna alla schermata iniziale
function resetGame() {
  document.getElementById("homeScreen").style.display = "block";
  document.getElementById("gameInfo").style.display = "none";
  canvas.classList.add("hidden");
}

// Carica i record dal server
function loadRecords() {
  $.ajax({
    url: "record.php",
    method: "GET",
    dataType: "json"
  })
  .done(function(data) {
    let recordList = $("#recordList");
    recordList.empty();
    data.sort((a, b) => b.score - a.score);
    data.forEach(function(record) {
      let li = $("<li>")
        .addClass("list-group-item bg-dark text-white")
        .text(record.name + " - Score: " + record.score + " - " + record.date);
      recordList.append(li);
    });
  })
  .fail(function(jqXHR, textStatus, errorThrown) {
    console.error("Errore nel caricamento dei record:", textStatus, errorThrown);
  });
}
function showRecords() {
  loadRecords();
  $("#recordModal").modal("show");
}
